-- ============================================================
-- Live Vibes — Migration v3: Invite / Referral System
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Add invite_code + referred_by to users
alter table public.users
  add column if not exists invite_code text unique,
  add column if not exists referred_by uuid references public.users(id);

-- 2. Backfill invite_code for existing users (first 8 chars of UUID)
update public.users
set invite_code = substring(id::text, 1, 8)
where invite_code is null;

-- 3. Auto-generate invite_code for new users via trigger
create or replace function public.set_invite_code()
returns trigger language plpgsql as $$
begin
  if new.invite_code is null then
    new.invite_code := substring(new.id::text, 1, 8);
  end if;
  return new;
end;
$$;

drop trigger if exists on_user_created_set_invite_code on public.users;
create trigger on_user_created_set_invite_code
  before insert on public.users
  for each row execute function public.set_invite_code();

-- 4. RPC: apply referral (called from app after profile setup)
create or replace function public.apply_referral(p_new_user_id uuid, p_invite_code text)
returns void language plpgsql security definer as $$
declare
  referrer_id uuid;
begin
  -- Look up referrer
  select id into referrer_id
  from public.users
  where invite_code = p_invite_code and id != p_new_user_id
  limit 1;

  if referrer_id is null then return; end if;

  -- Set referred_by on new user
  update public.users set referred_by = referrer_id where id = p_new_user_id;

  -- Award 50 points to both
  perform public.increment_vibe_points(p_new_user_id, 50);
  perform public.increment_vibe_points(referrer_id, 50);

  -- Notify referrer
  insert into public.notifications (user_id, type, icon, message)
  select referrer_id, 'social', '🎉',
    'Someone joined using your invite link! +50 Vibe Points added'
  where not exists (
    select 1 from public.notifications
    where user_id = referrer_id and message like '%joined using your invite%'
    and created_at > now() - interval '1 minute'
  );
end;
$$;
