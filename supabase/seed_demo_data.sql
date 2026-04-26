-- ============================================================
-- Live Vibes — Demo Data Seed
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Step 1: Add default columns to venues for fallback display
alter table public.venues
  add column if not exists default_vibe_score  integer default 0,
  add column if not exists default_checkin_count integer default 0,
  add column if not exists trending boolean default false;

-- Step 2: Set realistic vibe scores + attendance
update public.venues set default_vibe_score = 168, default_checkin_count = 204, trending = true  where name = 'Recess';
update public.venues set default_vibe_score = 161, default_checkin_count = 178, trending = true  where name = 'Cuba Libre';
update public.venues set default_vibe_score = 142, default_checkin_count = 87,  trending = false where name = 'Ladder 15';
update public.venues set default_vibe_score = 119, default_checkin_count = 67,  trending = false where name = 'Franky Bradley''s';
update public.venues set default_vibe_score = 98,  default_checkin_count = 43,  trending = false where name = 'Tin Roof';
update public.venues set default_vibe_score = 77,  default_checkin_count = 34,  trending = false where name = 'Harper''s Garden';
update public.venues set default_vibe_score = 61,  default_checkin_count = 28,  trending = false where name = 'McGillin''s Olde Ale House';
update public.venues set default_vibe_score = 44,  default_checkin_count = 19,  trending = false where name = 'Morgan''s Pier';
update public.venues set default_vibe_score = 34,  default_checkin_count = 11,  trending = false where name = 'Garage';

-- Step 3: Seed deals
insert into public.deals (venue_id, text, ends_at, active)
select id, '$5 Surfside + $4 drafts', now() + interval '3 hours', true
from public.venues where name = 'Ladder 15'
on conflict do nothing;

insert into public.deals (venue_id, text, ends_at, active)
select id, '2-for-1 Mojitos until midnight', now() + interval '4 hours', true
from public.venues where name = 'Cuba Libre'
on conflict do nothing;

insert into public.deals (venue_id, text, ends_at, active)
select id, 'Trivia Night + $3 PBR', now() + interval '2 hours', true
from public.venues where name = 'McGillin''s Olde Ale House'
on conflict do nothing;

insert into public.deals (venue_id, text, ends_at, active)
select id, '$6 well drinks all night', now() + interval '5 hours', true
from public.venues where name = 'Franky Bradley''s'
on conflict do nothing;

-- Step 4: Update calculate_vibe_score to use default when no real votes exist
create or replace function public.calculate_vibe_score(p_venue_id uuid)
returns integer language plpgsql as $$
declare
  vote_score    integer;
  default_score integer;
begin
  -- Get the default/seed score
  select default_vibe_score into default_score
  from public.venues where id = p_venue_id;

  -- Calculate from real votes (last 2 hours, checked-in users get 2x weight)
  select round(
    avg(
      case v.rating
        when 'lit'    then 175
        when 'vibing' then 120
        when 'mid'    then 65
        when 'dead'   then 20
      end *
      case when c.id is not null then 2 else 1 end
    )
  )::integer
  into vote_score
  from public.vibe_votes v
  left join public.checkins c
    on c.user_id = v.user_id
    and c.venue_id = v.venue_id
    and c.is_active = true
  where v.venue_id = p_venue_id
    and v.created_at > now() - interval '2 hours';

  -- Real votes override the default; fall back to default when no votes yet
  return least(coalesce(vote_score, default_score, 0), 175);
end;
$$;
