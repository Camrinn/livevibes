# Live Vibes — Build Log

Real-time nightlife social app. React 18 + Vite + Supabase + Mapbox.

---

## Sprint 2 — Profile, Privacy Gate, Going Tonight, Connect Flow

### Status: IN PROGRESS

| Feature | Status | File(s) |
|---|---|---|
| SQL migration v2 (age, instagram, mode, going_tonight) | ✅ Done | `supabase/migration_v2.sql` |
| ProfileSetup — multi-step onboarding | ✅ Done | `src/pages/ProfileSetup.jsx` |
| AppContext — profileComplete gate + refreshUser | ✅ Done | `src/context/AppContext.jsx` |
| App.jsx — /profile-setup route + redirect | ✅ Done | `src/App.jsx` |
| Privacy gate on Who's Here | ✅ Done | `src/pages/VenueDetail.jsx` |
| Going Tonight button + hook | ✅ Done | `src/hooks/useGoingTonight.js`, `src/components/VenueCard.jsx` |
| Connect modal — Instagram handle exchange | ✅ Done | `src/pages/VenueDetail.jsx` |
| Photo upload in post composer | ✅ Done | `src/pages/VenueDetail.jsx` |
| Profile page — real data + Instagram + logout | ✅ Done | `src/pages/Profile.jsx` |
| Auto-checkout SQL function | ✅ Done | `supabase/migration_v2.sql` |

---

## Architecture

```
src/
  pages/
    Auth.jsx           — phone OTP login
    Onboarding.jsx     — 3-slide intro
    ProfileSetup.jsx   — NEW: name/age/mode/instagram setup
    Home.jsx           — venue feed
    VenueDetail.jsx    — vibe/posts/who's here + privacy gate
    MapPage.jsx        — Mapbox map
    Profile.jsx        — user profile + settings
  context/
    AppContext.jsx      — session, user, checkin state, profileComplete
  hooks/
    useVenues.js       — venue list with live scores
    useVenueDetail.js  — single venue realtime data
    useCheckin.js      — check-in/out, post, vote
    useGoingTonight.js — NEW: going tonight intent + count
  components/
    VenueCard.jsx      — venue row with Going Tonight button
    VibeScore.jsx      — score display
    BottomNav.jsx      — tab navigation
  lib/
    supabase.js        — client + isConfigured flag
    geo.js             — haversine, GPS, distance

supabase/
  schema.sql           — full DB schema
  seed_demo_data.sql   — default vibe scores + deals
  migration_v2.sql     — NEW: age/instagram/mode/going_tonight/auto-checkout
```

## Key Decisions

- **Privacy gate**: Who's Here list is blurred + locked behind GPS check-in. Prevents passive browsing; creates incentive to check in.
- **Going Tonight**: Stored in `going_tonight` table. Anonymous count shown on venue card. Resets at 6 AM daily.
- **Connect flow**: Instagram handle exchange only — no in-app DMs. Tap Connect → modal shows your handle → sends request → target sees notification → on accept, both see each other's handles.
- **Mode system**: `friends` (blue), `vibing` (purple), `connect` (orange) — shown as a badge on Who's Here cards. Sets intent for the night.
- **Photo upload**: Supabase Storage bucket `post-media`. File → public URL → stored in `posts.media_url`.
- **Auto-checkout**: SQL function `auto_checkout_stale_checkins()` marks checkins inactive after 4 hours. Run via pg_cron or Edge Function.

## Supabase Setup Required

Run in SQL Editor in order:
1. `supabase/schema.sql`
2. `supabase/seed_demo_data.sql`
3. `supabase/migration_v2.sql`

Storage buckets to create:
- `post-media` — public read, auth write

## Test Credentials
- Phone: `12672313533`
- OTP: `012199`

---

## Sprint 1 — Foundation (Complete)

| Feature | Status |
|---|---|
| Supabase auth (phone OTP) | ✅ |
| Venue schema + RLS | ✅ |
| Vibe score system (weighted votes) | ✅ |
| Real-time posts + checkins | ✅ |
| Mapbox map with venue markers | ✅ |
| Mock data fallback | ✅ |
| Vercel deployment | ✅ |
| Demo data seed (default scores/deals) | ✅ |

---

## Next Up — Sprint 3

- Push notifications (Supabase Edge Function → Expo / web push)
- Invite flow (shareable link → `?ref=userId`)
- Venue owner dashboard (post deals, see analytics)
- Friend network (mutual friends badge from real connections)
- Going Tonight analytics (show "32 people going nearby tonight")
