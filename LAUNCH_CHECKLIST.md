# Live Vibes — Pre-Launch Checklist

## 🔴 Blockers (must fix before anyone uses it)

- [ ] **Twilio SMS** — set up in Supabase: Auth → Providers → Phone → Twilio. Without this, no one can sign up (OTP never sends).
- [ ] **Set admin users** — run in Supabase SQL editor:
  ```sql
  UPDATE users SET is_admin = true
  WHERE id IN (
    SELECT id FROM auth.users
    WHERE phone IN ('+12672313533', '+12155940505')
  );
  ```
- [ ] **Supabase redirect URLs** — Auth → URL Configuration:
  - Site URL: `https://vibars.com`
  - Redirect URL: `https://vibars.com/**`
- [ ] **Verify Vercel deployment** — confirm `vibars.com` resolves, SSL is active, and the app loads

---

## 🟠 Security / Integrity (fix before real users)

- [ ] **Require geolocation for check-in** — currently falls back to `allowed: true` if user denies location, meaning anyone can fake a check-in from anywhere. In `src/lib/geo.js`, remove the fallback and return `{ allowed: false, error: 'Location permission required' }` on deny. (Discussed — hold until pre-launch)
- [ ] **Who's Here privacy** — check-in data is fetched for all visitors and only blurred with CSS, meaning someone could read real names from the DOM without being checked in. Fix: add a Supabase RLS policy that only returns checkin rows if the requesting user also has an active checkin at that venue.
- [ ] **Verify post-media storage bucket policies** — confirm the `post-media` bucket in Supabase Storage allows authenticated users to upload and that files are publicly readable.
- [ ] **Verify posts table RLS** — confirm authenticated users can insert to `posts` and only read/delete their own.
- [ ] **Verify connections table RLS** — users should only see connection requests sent to them.
- [ ] **Verify vibe_votes upsert works** — confirm the `user_id,venue_id` unique constraint exists so votes can't be spammed.

---

## 🟡 Features to Test End-to-End

- [ ] **Sign-up flow** — phone → OTP → profile setup (name, username, age, mode, instagram)
- [ ] **Guest browsing** — home page loads with blurred data, venue taps prompt sign-up
- [ ] **Check-in flow** — check in at a venue, verify it appears in Who's Here for others
- [ ] **Post text update** — check in, go to Posts tab, post text, confirm it appears live
- [ ] **Post photo** — check in, attach an image, confirm it uploads and displays
- [ ] **Post video** — check in, attach an MP4, confirm it uploads and displays
- [ ] **Vibe vote** — check in, cast a vote, confirm score updates
- [ ] **Going Tonight toggle** — mark Going, confirm count updates and persists on reload
- [ ] **Connect flow** — tap Connect on someone in Who's Here, confirm request appears in their Notifications
- [ ] **Accept/Decline connection** — accept a request, confirm both sides see the result
- [ ] **Profile edit** — edit name, username, bio, instagram, mode, confirm saves correctly
- [ ] **Visibility toggle** — toggle off, confirm you disappear from Who's Here
- [ ] **Push notifications** — enable in Profile → Settings, confirm OneSignal registers the device
- [ ] **Invite link** — share link from Profile, confirm `/join/:code` redirects correctly
- [ ] **Admin panel** — log in as admin, approve/reject a venue submission
- [ ] **Add Venue flow** — submit a venue via Google Places autocomplete

---

## 🟡 Polish / UX

- [ ] **Test on iPhone Safari** — check for any layout issues, especially the sign-up modal keyboard behavior
- [ ] **Test on Android Chrome** — confirm PWA behavior and push notifications work
- [ ] **App icon** — add a proper icon to `public/` and update `index.html` meta tags for home screen icon on iOS/Android
- [ ] **PWA manifest** — `public/manifest.json` with name, icons, theme color, start_url
- [ ] **Favicon** — replace the default Vite favicon
- [ ] **OG / social meta tags** — add `og:title`, `og:description`, `og:image` in `index.html` so sharing the link looks good

---

## 🟢 Nice-to-Have (post-launch)

- [ ] **Error monitoring** — add Sentry or similar so you know when things break in production
- [ ] **Analytics** — basic page view / check-in / post event tracking (PostHog or Plausible)
- [ ] **Rate limiting on vibe votes** — confirm the 5-posts/hour cap in `can_user_post` is working as expected
- [ ] **Auto check-out** — consider a Supabase cron job that sets `is_active = false` on checkins older than 8 hours
- [ ] **Terms & Privacy pages** — the sign-up modal links to them but they don't exist yet
- [ ] **Content moderation** — decide what happens when a post is flagged (right now flags go to `post_flags` table but nothing acts on them)
- [ ] **Venue seeding** — add more Philadelphia venues beyond the initial 9
