# 🔥 Live Vibes

A real-time nightlife app that lets you see the vibe of nearby bars and venues before you go.

## Features Built
- 📍 **Explore Page** — Browse nearby venues with live vibe scores (0–175)
- 🗺️ **Map View** — Visual map showing all venues color-coded by vibe
- 📍 **Check In** — Check in to venues and rate the vibe
- 👥 **Who's Here** — See profiles of people at the same venue and connect
- 💬 **Live Posts** — Location-locked posts only visible when at the venue
- 🍹 **Deals & Alerts** — Real-time notifications for happy hours and specials
- 👤 **Profile** — User profile with badges, vibe points, and settings

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Setup

1. **Open this folder in VS Code**
   ```
   cd live-vibes
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Run the dev server**
   ```
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

5. **For mobile testing** — Open Chrome DevTools → Toggle Device Toolbar → Select a phone size

## Project Structure

```
live-vibes/
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx     — Mobile navigation bar
│   │   ├── VenueCard.jsx     — Venue list card
│   │   └── VibeScore.jsx     — Animated circular vibe score
│   ├── pages/
│   │   ├── Home.jsx          — Explore/discover page
│   │   ├── MapPage.jsx       — Visual venue map
│   │   ├── CheckIn.jsx       — Check in flow
│   │   ├── VenueDetail.jsx   — Venue deep dive (Vibe, Posts, Who's Here)
│   │   ├── Notifications.jsx — Deals and activity alerts
│   │   └── Profile.jsx       — User profile and settings
│   ├── data/
│   │   └── mockData.js       — Sample venues, users, notifications
│   ├── App.jsx               — Main app with routing
│   ├── main.jsx              — Entry point
│   └── index.css             — Global styles and design tokens
├── index.html
├── vite.config.js
└── package.json
```

## Next Steps

### Backend (when ready to build for real)
- [ ] Set up Supabase or Firebase for real-time data
- [ ] Add user authentication (phone number or social login)
- [ ] Real geolocation for venue check-ins and radius filtering
- [ ] Push notifications via Firebase Cloud Messaging
- [ ] Google Maps API integration for the real map
- [ ] Image/video uploads for posts

### Features to Add
- [ ] Search across cities (travel mode)
- [ ] Friend system and invites
- [ ] Business/venue owner dashboard
- [ ] Ambassador program portal
- [ ] Vibe score analytics for venues

## Design System

Colors:
- Background: `#0A0A12`
- Orange Accent (LIT): `#FF6B2B`
- Cyan (Interactive): `#00D4FF`
- Purple (Social): `#8B5CF6`
- Green (Deals): `#10F587`

Fonts:
- Display: Syne (headings, scores, labels)
- Body: DM Sans (descriptions, UI text)
