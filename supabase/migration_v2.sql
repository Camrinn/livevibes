-- ============================================================
-- Live Vibes — Migration v2
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Extend users table
alter table public.users
  add column if not exists age             integer,
  add column if not exists instagram_handle text,
  add column if not exists mode            text default 'vibing' check (mode in ('friends','vibing','connect')),
  add column if not exists profile_complete boolean default false;

-- 2. Create going_tonight table
create table if not exists public.going_tonight (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  venue_id   uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, venue_id)
);

alter table public.going_tonight enable row level security;

create policy "Public read going_tonight" on public.going_tonight
  for select using (true);

create policy "Users manage own going_tonight" on public.going_tonight
  for all using (auth.uid() = user_id);

-- Index for fast count queries per venue
create index if not exists going_tonight_venue_idx on public.going_tonight(venue_id);

-- 3. Auto-clear going_tonight each day at 6 AM (call via pg_cron or Edge Function)
create or replace function public.clear_going_tonight()
returns void language plpgsql as $$
begin
  delete from public.going_tonight
  where created_at < (current_date at time zone 'America/New_York');
end;
$$;

-- 4. Auto-checkout stale check-ins after 4 hours
create or replace function public.auto_checkout_stale_checkins()
returns void language plpgsql as $$
begin
  update public.checkins
  set is_active = false, checked_out_at = now()
  where is_active = true
    and checked_in_at < now() - interval '4 hours';
end;
$$;

-- 5. Add checked_in_at + checked_out_at to checkins if not present
alter table public.checkins
  add column if not exists checked_in_at  timestamptz default now(),
  add column if not exists checked_out_at timestamptz;

-- 6. RLS: users can update their own going_tonight row
-- (already covered by policy above)

-- 7. Storage bucket policy helper (run manually in Supabase dashboard):
-- Bucket name: post-media
-- Public: true (anyone can read)
-- Auth required to upload: true

-- 8. Grant count access on going_tonight via a helper RPC
create or replace function public.get_going_tonight_count(p_venue_id uuid)
returns integer language plpgsql stable as $$
declare
  cnt integer;
begin
  select count(*) into cnt
  from public.going_tonight
  where venue_id = p_venue_id
    and created_at >= (current_date at time zone 'America/New_York');
  return coalesce(cnt, 0);
end;
$$;

-- 9. RPC: toggle going tonight (insert or delete)
create or replace function public.toggle_going_tonight(p_venue_id uuid)
returns boolean language plpgsql security definer as $$
declare
  existing_id uuid;
  uid uuid := auth.uid();
begin
  select id into existing_id
  from public.going_tonight
  where user_id = uid and venue_id = p_venue_id
  limit 1;

  if existing_id is not null then
    delete from public.going_tonight where id = existing_id;
    return false; -- now NOT going
  else
    insert into public.going_tonight (user_id, venue_id) values (uid, p_venue_id);
    return true;  -- now IS going
  end if;
end;
$$;

-- 10. Connection request: send instagram handle on accept
-- connections table should already exist from schema.sql
-- Add instagram exchange columns if not present
alter table public.connections
  add column if not exists requester_instagram text,
  add column if not exists target_instagram    text;
