-- ============================================================
-- Live Vibes — Full Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis"; -- for geo queries

-- ============================================================
-- USERS
-- ============================================================
create table public.users (
  id          uuid references auth.users on delete cascade primary key,
  handle      text unique not null,
  name        text not null,
  bio         text default '',
  avatar_url  text,
  vibe_points integer default 0,
  check_in_count integer default 0,
  visible     boolean default true, -- show on Who's Here
  created_at  timestamptz default now()
);

-- Auto-create user row when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, handle, name)
  values (
    new.id,
    '@user_' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'name', 'New User')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- VENUES
-- ============================================================
create table public.venues (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  type        text not null,
  address     text not null,
  lat         double precision not null,
  lng         double precision not null,
  color       text default '#FF6B2B',
  tags        text[] default '{}',
  owner_id    uuid references public.users(id),
  created_at  timestamptz default now()
);

-- ============================================================
-- DEALS
-- ============================================================
create table public.deals (
  id         uuid default uuid_generate_v4() primary key,
  venue_id   uuid references public.venues(id) on delete cascade not null,
  text       text not null,
  ends_at    timestamptz not null,
  active     boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- CHECK-INS
-- ============================================================
create table public.checkins (
  id             uuid default uuid_generate_v4() primary key,
  user_id        uuid references public.users(id) on delete cascade not null,
  venue_id       uuid references public.venues(id) on delete cascade not null,
  checked_in_at  timestamptz default now(),
  checked_out_at timestamptz,
  is_active      boolean default true,
  -- prevent duplicate active check-ins
  constraint one_active_checkin unique (user_id, is_active) deferrable initially deferred
);

-- View: count of currently active check-ins per venue
create or replace view public.venue_checkin_counts as
  select venue_id, count(*) as count
  from public.checkins
  where is_active = true
  group by venue_id;

-- ============================================================
-- VIBE VOTES
-- ============================================================
create type public.vibe_rating as enum ('lit', 'vibing', 'mid', 'dead');

create table public.vibe_votes (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.users(id) on delete cascade not null,
  venue_id   uuid references public.venues(id) on delete cascade not null,
  rating     public.vibe_rating not null,
  created_at timestamptz default now(),
  -- one vote per user per venue per hour
  constraint one_vote_per_hour unique (user_id, venue_id)
);

-- Function: calculate vibe score (0–175) from recent votes
-- Votes older than 2h are excluded; checked-in users get 2x weight
create or replace function public.calculate_vibe_score(p_venue_id uuid)
returns integer language plpgsql as $$
declare
  score integer;
begin
  select coalesce(
    round(
      avg(
        case v.rating
          when 'lit'    then 175
          when 'vibing' then 120
          when 'mid'    then 65
          when 'dead'   then 20
        end *
        case when c.id is not null then 2 else 1 end  -- double weight if checked in
      )
    )::integer,
  0)
  into score
  from public.vibe_votes v
  left join public.checkins c
    on c.user_id = v.user_id
    and c.venue_id = v.venue_id
    and c.is_active = true
  where v.venue_id = p_venue_id
    and v.created_at > now() - interval '2 hours';

  return least(score, 175);
end;
$$;

-- ============================================================
-- POSTS
-- ============================================================
create table public.posts (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references public.users(id) on delete cascade not null,
  venue_id     uuid references public.venues(id) on delete cascade not null,
  content      text not null,
  media_url    text,            -- photo/video from Supabase Storage
  likes        integer default 0,
  created_at   timestamptz default now()
);

-- Post likes
create table public.post_likes (
  user_id  uuid references public.users(id) on delete cascade,
  post_id  uuid references public.posts(id) on delete cascade,
  primary key (user_id, post_id)
);

-- ============================================================
-- CONNECTIONS (friend requests)
-- ============================================================
create type public.connection_status as enum ('pending', 'accepted');

create table public.connections (
  id           uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.users(id) on delete cascade not null,
  target_id    uuid references public.users(id) on delete cascade not null,
  status       public.connection_status default 'pending',
  created_at   timestamptz default now(),
  constraint no_self_connect check (requester_id != target_id),
  constraint unique_connection unique (requester_id, target_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create type public.notif_type as enum ('deal', 'social', 'vibe');

create table public.notifications (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.users(id) on delete cascade not null,
  type       public.notif_type not null,
  message    text not null,
  venue_id   uuid references public.venues(id),
  icon       text default '🔔',
  read       boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users         enable row level security;
alter table public.venues        enable row level security;
alter table public.deals         enable row level security;
alter table public.checkins      enable row level security;
alter table public.vibe_votes    enable row level security;
alter table public.posts         enable row level security;
alter table public.post_likes    enable row level security;
alter table public.connections   enable row level security;
alter table public.notifications enable row level security;

-- Users: public read, own write
create policy "users_public_read"  on public.users for select using (true);
create policy "users_own_update"   on public.users for update using (auth.uid() = id);

-- Venues: public read
create policy "venues_public_read" on public.venues for select using (true);
create policy "venues_owner_write" on public.venues for all using (auth.uid() = owner_id);

-- Deals: public read
create policy "deals_public_read"  on public.deals for select using (true);

-- Check-ins: public read, own write
create policy "checkins_public_read" on public.checkins for select using (true);
create policy "checkins_own_write"   on public.checkins for insert with check (auth.uid() = user_id);
create policy "checkins_own_update"  on public.checkins for update using (auth.uid() = user_id);

-- Vibe votes: public read, own write
create policy "votes_public_read" on public.vibe_votes for select using (true);
create policy "votes_own_write"   on public.vibe_votes for insert with check (auth.uid() = user_id);
create policy "votes_own_update"  on public.vibe_votes for update using (auth.uid() = user_id);

-- Posts: public read, own write
create policy "posts_public_read" on public.posts for select using (true);
create policy "posts_own_write"   on public.posts for insert with check (auth.uid() = user_id);
create policy "posts_own_delete"  on public.posts for delete using (auth.uid() = user_id);

-- Post likes: public read, own write
create policy "likes_public_read" on public.post_likes for select using (true);
create policy "likes_own_write"   on public.post_likes for all using (auth.uid() = user_id);

-- Connections: own read/write
create policy "connections_own"   on public.connections for all using (
  auth.uid() = requester_id or auth.uid() = target_id
);

-- Notifications: own only
create policy "notifs_own" on public.notifications for all using (auth.uid() = user_id);

-- ============================================================
-- HELPER: Increment vibe points (called after check-in / post / vote)
-- ============================================================
create or replace function public.increment_vibe_points(p_user_id uuid, p_points integer)
returns void language plpgsql security definer as $$
begin
  update public.users
  set vibe_points = vibe_points + p_points
  where id = p_user_id;
end;
$$;

-- ============================================================
-- SEED: Philadelphia Venues
-- Run separately after schema, update lat/lng as needed
-- ============================================================

insert into public.venues (name, type, address, lat, lng, color, tags) values
  ('Ladder 15',              'Sports Bar',     '1528 Sansom St, Philadelphia', 39.9496, -75.1645, '#FF6B2B', array['NFL Sunday','Craft Beer','Dance Floor']),
  ('Tin Roof',               'Live Music Bar', '1526 Sansom St, Philadelphia', 39.9497, -75.1643, '#8B5CF6', array['Live Music','Cocktails','Rooftop']),
  ('McGillin''s Olde Ale House', 'Irish Pub',  '1310 Drury St, Philadelphia',  39.9498, -75.1590, '#10F587', array['Trivia Night','Whiskey','Pub']),
  ('Recess',                 'Nightclub',      '1526 Sansom St, Philadelphia', 39.9499, -75.1640, '#FF3B5C', array['EDM','VIP','Bottle Service']),
  ('Garage',                 'Rooftop Bar',    '1231 N Front St, Philadelphia', 39.9672, -75.1378, '#00D4FF', array['Rooftop','Cocktails','Chill']),
  ('Cuba Libre',             'Latin Club',     '10 S Front St, Philadelphia',   39.9472, -75.1416, '#FF6B2B', array['Latin Music','Dancing','Mojitos']),
  ('Franky Bradley''s',      'Music Venue',    '1320 Chancellor St, Philadelphia', 39.9488, -75.1642, '#8B5CF6', array['Indie Music','Full Bar','Late Night']),
  ('Harper''s Garden',       'Garden Bar',     '31 S 18th St, Philadelphia',    39.9502, -75.1739, '#10F587', array['Outdoor','Wine & Beer','Date Night']),
  ('Morgan''s Pier',         'Waterfront Bar', '221 N Columbus Blvd, Philadelphia', 39.9562, -75.1381, '#00D4FF', array['River Views','Beer Garden','Casual']);
