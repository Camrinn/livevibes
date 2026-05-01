-- ============================================================
-- Live Vibes — Migration v4: Phase 2 (Venue Management + Social Feed)
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE
-- ============================================================


-- ============================================================
-- 1. EXTEND VENUES TABLE
-- ============================================================
alter table public.venues
  add column if not exists status           text default 'active'
    check (status in ('pending','active','rejected','archived')),
  add column if not exists submitted_by     uuid references public.users(id),
  add column if not exists submitted_at     timestamptz,
  add column if not exists pinned           boolean default false,
  add column if not exists hours            jsonb,
  add column if not exists phone            text,
  add column if not exists website          text,
  add column if not exists description      text,
  add column if not exists cover_image_url  text,
  add column if not exists rejection_reason text,
  add column if not exists spam_score       integer default 0,
  add column if not exists moderation_level text default 'standard'
    check (moderation_level in ('strict','standard','open'));

-- Backfill: all existing venues are already live
update public.venues set status = 'active' where status is null;


-- ============================================================
-- 2. EXTEND USERS TABLE
-- ============================================================
alter table public.users
  add column if not exists is_admin       boolean default false,
  add column if not exists is_super_admin boolean default false,
  add column if not exists banned         boolean default false,
  add column if not exists ban_reason     text,
  add column if not exists post_count     integer default 0;


-- ============================================================
-- 3. EXTEND POSTS TABLE
-- ============================================================
alter table public.posts
  add column if not exists flagged          boolean default false,
  add column if not exists flag_count       integer default 0,
  add column if not exists deleted_at       timestamptz,
  add column if not exists deleted_by       uuid references public.users(id),
  add column if not exists media_type       text check (media_type in ('photo','video',null)),
  add column if not exists media_thumb_url  text;

-- Expiry column: set to created_at + 24h via trigger on insert
alter table public.posts
  add column if not exists expires_at timestamptz;

create or replace function public.set_post_expires_at()
returns trigger language plpgsql as $$
begin
  new.expires_at := new.created_at + interval '24 hours';
  return new;
end;
$$;

drop trigger if exists on_post_insert_set_expiry on public.posts;
create trigger on_post_insert_set_expiry
  before insert on public.posts
  for each row execute function public.set_post_expires_at();

-- Backfill expires_at for any existing posts
update public.posts set expires_at = created_at + interval '24 hours' where expires_at is null;

-- Add content length guard
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'posts_content_length' and table_name = 'posts'
  ) then
    alter table public.posts add constraint posts_content_length check (char_length(content) <= 500);
  end if;
end $$;

-- Performance index: live feed per venue
create index if not exists posts_venue_feed_idx
  on public.posts (venue_id, created_at desc)
  where deleted_at is null and flagged = false;

-- Cleanup index: expired posts
create index if not exists posts_expires_idx
  on public.posts (expires_at)
  where deleted_at is null;


-- ============================================================
-- 4. EXTEND POST_LIKES TABLE (add reaction types)
-- ============================================================
alter table public.post_likes
  add column if not exists reaction_type text default 'fire'
    check (reaction_type in ('fire','lit','vibe','lol'));


-- ============================================================
-- 5. POST FLAGS TABLE (new)
-- ============================================================
create table if not exists public.post_flags (
  id          uuid default uuid_generate_v4() primary key,
  post_id     uuid references public.posts(id) on delete cascade not null,
  reporter_id uuid references public.users(id) on delete cascade not null,
  reason      text not null check (reason in (
    'inappropriate','nudity','spam','harassment','violence','other'
  )),
  notes       text,
  resolved    boolean default false,
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  created_at  timestamptz default now(),
  constraint one_flag_per_user unique (post_id, reporter_id)
);

alter table public.post_flags enable row level security;

create policy "flags_own_insert" on public.post_flags
  for insert with check (auth.uid() = reporter_id);

create policy "flags_own_read" on public.post_flags
  for select using (
    auth.uid() = reporter_id
    or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "flags_admin_update" on public.post_flags
  for update using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create index if not exists flags_unresolved_idx
  on public.post_flags (resolved, created_at desc)
  where resolved = false;

-- Trigger: auto-hide post after N flags (threshold depends on venue moderation_level)
create or replace function public.increment_flag_count()
returns trigger language plpgsql security definer as $$
declare
  v_threshold integer;
begin
  select case v.moderation_level
    when 'strict' then 1
    when 'open'   then 5
    else               3
  end
  into v_threshold
  from public.venues v
  inner join public.posts p on p.venue_id = v.id
  where p.id = new.post_id;

  update public.posts
  set flag_count = flag_count + 1,
      flagged    = (flag_count + 1 >= coalesce(v_threshold, 3))
  where id = new.post_id;

  return new;
end;
$$;

drop trigger if exists on_post_flagged on public.post_flags;
create trigger on_post_flagged
  after insert on public.post_flags
  for each row execute function public.increment_flag_count();


-- ============================================================
-- 6. VENUE EDIT HISTORY TABLE (new)
-- ============================================================
create table if not exists public.venue_edit_history (
  id         uuid default uuid_generate_v4() primary key,
  venue_id   uuid references public.venues(id) on delete cascade not null,
  edited_by  uuid references public.users(id) not null,
  field_name text not null,
  old_value  text,
  new_value  text,
  edited_at  timestamptz default now()
);

alter table public.venue_edit_history enable row level security;

create policy "edit_history_admin_read" on public.venue_edit_history
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "edit_history_admin_insert" on public.venue_edit_history
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create index if not exists venue_edit_history_venue_idx
  on public.venue_edit_history (venue_id, edited_at desc);


-- ============================================================
-- 7. VENUE SUBMISSIONS LOG TABLE (spam tracking)
-- ============================================================
create table if not exists public.venue_submissions_log (
  id           uuid default uuid_generate_v4() primary key,
  submitter_id uuid references public.users(id) on delete cascade,
  venue_name   text,
  submitted_at timestamptz default now()
);

alter table public.venue_submissions_log enable row level security;

create policy "submissions_log_admin_read" on public.venue_submissions_log
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "submissions_log_own_insert" on public.venue_submissions_log
  for insert with check (auth.uid() = submitter_id);


-- ============================================================
-- 8. UPDATE RLS POLICIES
-- ============================================================

-- Venues: replace owner-only write with layered policies
drop policy if exists "venues_owner_write" on public.venues;

-- Any authenticated user can submit a venue (always as pending)
create policy "venues_authenticated_insert" on public.venues
  for insert with check (
    auth.uid() is not null
    and status = 'pending'
  );

-- Admins can update any venue
create policy "venues_admin_update" on public.venues
  for update using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- Super-admins can delete venues
create policy "venues_superadmin_delete" on public.venues
  for delete using (
    exists (select 1 from public.users where id = auth.uid() and is_super_admin = true)
  );

-- Deals: admins can write deals
create policy "deals_admin_write" on public.deals
  for all using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- Posts: replace public_read with one that respects expiry + soft delete
drop policy if exists "posts_public_read" on public.posts;

create policy "posts_live_read" on public.posts
  for select using (
    deleted_at is null
    and (expires_at is null or expires_at > now())
    and (
      flagged = false
      or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
    )
  );

-- Posts: admins can soft-delete and update any post
create policy "posts_admin_update" on public.posts
  for update using (
    auth.uid() = user_id
    or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "posts_admin_delete" on public.posts
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- Users: admins can update any user (for ban, promote, etc.)
create policy "users_admin_update" on public.users
  for update using (
    auth.uid() = id
    or exists (select 1 from public.users where id = auth.uid() and is_super_admin = true)
  );


-- ============================================================
-- 9. AUTO-APPROVE TRIGGER (3 unique check-ins approves a pending venue)
-- ============================================================
create or replace function public.check_auto_approve_venue()
returns trigger language plpgsql security definer as $$
declare
  v_unique_count integer;
  v_status       text;
begin
  select status into v_status from public.venues where id = new.venue_id;
  if v_status != 'pending' then return new; end if;

  select count(distinct user_id) into v_unique_count
  from public.checkins
  where venue_id = new.venue_id;

  if v_unique_count >= 3 then
    update public.venues set status = 'active' where id = new.venue_id;

    -- Notify the original submitter
    insert into public.notifications (user_id, type, icon, message, venue_id)
    select submitted_by, 'social', '🎉',
      'Your venue was approved by the community!', id
    from public.venues
    where id = new.venue_id and submitted_by is not null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_checkin_auto_approve on public.checkins;
create trigger on_checkin_auto_approve
  after insert on public.checkins
  for each row execute function public.check_auto_approve_venue();


-- ============================================================
-- 10. RPC: can_submit_venue (spam guard)
-- ============================================================
create or replace function public.can_submit_venue(p_user_id uuid)
returns boolean language plpgsql security definer as $$
declare
  v_recent_count integer;
  v_age_days     numeric;
begin
  -- Account must be at least 7 days old
  select extract(epoch from (now() - created_at)) / 86400
  into v_age_days
  from auth.users where id = p_user_id;

  if v_age_days < 7 then return false; end if;

  -- Max 3 submissions per 24 hours
  select count(*) into v_recent_count
  from public.venue_submissions_log
  where submitter_id = p_user_id
    and submitted_at > now() - interval '24 hours';

  return v_recent_count < 3;
end;
$$;


-- ============================================================
-- 11. RPC: can_user_post (rate limit + check-in enforcement)
-- ============================================================
create or replace function public.can_user_post(p_venue_id uuid)
returns boolean language plpgsql security definer as $$
declare
  v_recent_count integer;
  v_is_checked_in boolean;
begin
  -- Must have an active check-in at this venue
  select exists(
    select 1 from public.checkins
    where user_id = auth.uid()
      and venue_id = p_venue_id
      and is_active = true
  ) into v_is_checked_in;

  if not v_is_checked_in then return false; end if;

  -- Max 5 posts per hour per venue
  select count(*) into v_recent_count
  from public.posts
  where user_id = auth.uid()
    and venue_id = p_venue_id
    and created_at > now() - interval '1 hour'
    and deleted_at is null;

  return v_recent_count < 5;
end;
$$;


-- ============================================================
-- 12. RPC: admin_remove_post (soft delete with audit)
-- ============================================================
create or replace function public.admin_remove_post(p_post_id uuid, p_reason text default null)
returns void language plpgsql security definer as $$
begin
  -- Only admins can call this
  if not exists (
    select 1 from public.users where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Unauthorized';
  end if;

  update public.posts
  set deleted_at = now(),
      deleted_by = auth.uid()
  where id = p_post_id;

  -- Mark all flags on this post as resolved
  update public.post_flags
  set resolved = true, resolved_by = auth.uid(), resolved_at = now()
  where post_id = p_post_id and resolved = false;
end;
$$;


-- ============================================================
-- 13. RPC: admin_resolve_flags (dismiss flags, keep post visible)
-- ============================================================
create or replace function public.admin_resolve_flags(p_post_id uuid)
returns void language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.users where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Unauthorized';
  end if;

  update public.posts
  set flagged = false, flag_count = 0
  where id = p_post_id;

  update public.post_flags
  set resolved = true, resolved_by = auth.uid(), resolved_at = now()
  where post_id = p_post_id and resolved = false;
end;
$$;


-- ============================================================
-- 14. RPC: get_admin_stats (single call for dashboard)
-- ============================================================
create or replace function public.get_admin_stats()
returns jsonb language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.users where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Unauthorized';
  end if;

  return (
    select jsonb_build_object(
      'active_venues',       (select count(*) from public.venues where status = 'active'),
      'pending_venues',      (select count(*) from public.venues where status = 'pending'),
      'total_users',         (select count(*) from public.users),
      'checked_in_now',      (select count(*) from public.checkins where is_active = true),
      'posts_today',         (select count(*) from public.posts
                               where created_at > current_date and deleted_at is null),
      'flags_pending',       (select count(*) from public.post_flags where resolved = false),
      'submissions_this_week', (select count(*) from public.venue_submissions_log
                                 where submitted_at > now() - interval '7 days')
    )
  );
end;
$$;


-- ============================================================
-- 15. CHECKINS: add created_at alias column if missing
-- (AppContext queries created_at but schema uses checked_in_at)
-- ============================================================
alter table public.checkins
  add column if not exists created_at timestamptz default now();

-- Backfill created_at from checked_in_at for existing rows
update public.checkins
set created_at = checked_in_at
where created_at is null and checked_in_at is not null;


-- ============================================================
-- DONE
-- After running this migration, set your admin account:
--   UPDATE public.users SET is_admin = true, is_super_admin = true
--   WHERE id = 'your-user-uuid-here';
-- ============================================================
