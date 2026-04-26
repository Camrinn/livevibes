export const venues = [
  {
    id: 1,
    name: "Ladder 15",
    type: "Sports Bar",
    address: "1528 Sansom St, Philadelphia",
    distance: "0.2 mi",
    vibeScore: 142,
    checkedIn: 87,
    tags: ["NFL Sunday", "Craft Beer", "Dance Floor"],
    color: "#FF6B2B",
    trending: false,
    deal: {
      active: true,
      text: "$5 Surfside + $4 drafts",
      endsAt: "11PM"
    },
    posts: [
      { id: 1, user: "Jordan M.", avatar: "JM", time: "2m ago", content: "This place is PACKED 🔥", likes: 14, hasMedia: false },
      { id: 2, user: "Ashley R.", avatar: "AR", time: "8m ago", content: "DJ just started, vibe is insane rn", likes: 22, hasMedia: true },
      { id: 3, user: "Tyler K.", avatar: "TK", time: "15m ago", content: "Great happy hour deals happening", likes: 8, hasMedia: false },
    ],
    whoIsHere: [
      { id: 1, name: "Mia Santos", avatar: "MS", age: 24, bio: "Out for a good time 🎉", mutual: 2 },
      { id: 2, name: "Jake Rivera", avatar: "JR", age: 26, bio: "Eagles fan always 🦅", mutual: 0 },
      { id: 3, name: "Priya K.", avatar: "PK", age: 23, bio: "Love meeting new people", mutual: 1 },
      { id: 4, name: "Chris W.", avatar: "CW", age: 28, bio: "Here every Friday 😂", mutual: 3 },
    ]
  },
  {
    id: 2,
    name: "Tin Roof",
    type: "Live Music Bar",
    address: "1526 Sansom St, Philadelphia",
    distance: "0.3 mi",
    vibeScore: 98,
    checkedIn: 43,
    tags: ["Live Music", "Cocktails", "Rooftop"],
    color: "#8B5CF6",
    trending: false,
    deal: null,
    posts: [
      { id: 1, user: "Sam L.", avatar: "SL", time: "5m ago", content: "Band is fire tonight 🎸", likes: 19, hasMedia: true },
      { id: 2, user: "Dana P.", avatar: "DP", time: "20m ago", content: "Rooftop is open, grab a spot now", likes: 11, hasMedia: false },
    ],
    whoIsHere: [
      { id: 1, name: "Alex Chen", avatar: "AC", age: 25, bio: "Music lover 🎵", mutual: 1 },
      { id: 2, name: "Bella T.", avatar: "BT", age: 22, bio: "First time here!", mutual: 0 },
      { id: 3, name: "Dana Park", avatar: "DP", age: 27, bio: "Here for the rooftop vibes", mutual: 0 },
    ]
  },
  {
    id: 3,
    name: "McGillin's Olde Ale House",
    type: "Irish Pub",
    address: "1310 Drury St, Philadelphia",
    distance: "0.5 mi",
    vibeScore: 61,
    checkedIn: 28,
    tags: ["Trivia Night", "Whiskey", "Pub"],
    color: "#10F587",
    trending: false,
    deal: {
      active: true,
      text: "Trivia Night + $3 PBR",
      endsAt: "10PM"
    },
    posts: [
      { id: 1, user: "Kevin B.", avatar: "KB", time: "12m ago", content: "Trivia is at 9, still spots open!", likes: 5, hasMedia: false },
      { id: 2, user: "Sara E.", avatar: "SE", time: "30m ago", content: "Great spot for a chill night", likes: 3, hasMedia: false },
    ],
    whoIsHere: [
      { id: 1, name: "Tom H.", avatar: "TH", age: 30, bio: "Trivia champ 🏆", mutual: 2 },
      { id: 2, name: "Sara E.", avatar: "SE", age: 27, bio: "Love a good pub night", mutual: 0 },
      { id: 3, name: "Mike D.", avatar: "MD", age: 29, bio: "Here for the vibes", mutual: 1 },
    ]
  },
  {
    id: 4,
    name: "Recess",
    type: "Nightclub",
    address: "1526 Sansom St, Philadelphia",
    distance: "0.7 mi",
    vibeScore: 168,
    checkedIn: 204,
    tags: ["EDM", "VIP", "Bottle Service"],
    color: "#FF3B5C",
    trending: true,
    deal: null,
    posts: [
      { id: 1, user: "Lena V.", avatar: "LV", time: "1m ago", content: "DJ Khal is going OFF right now 🎧", likes: 88, hasMedia: true },
      { id: 2, user: "Marco S.", avatar: "MS", time: "3m ago", content: "Line outside but worth it fr", likes: 34, hasMedia: false },
      { id: 3, user: "Jess P.", avatar: "JP", time: "7m ago", content: "Best night out this month no cap 🔥", likes: 61, hasMedia: true },
      { id: 4, user: "Tyler N.", avatar: "TN", time: "11m ago", content: "VIP section is wild tonight", likes: 45, hasMedia: false },
    ],
    whoIsHere: [
      { id: 1, name: "Zoe F.", avatar: "ZF", age: 23, bio: "Dance floor queen 💃", mutual: 0 },
      { id: 2, name: "Nate O.", avatar: "NO", age: 25, bio: "DJ set enjoyer", mutual: 2 },
      { id: 3, name: "Chloe B.", avatar: "CB", age: 24, bio: "VIP only lol", mutual: 1 },
      { id: 4, name: "Ryan A.", avatar: "RA", age: 27, bio: "Club rat 🐀", mutual: 0 },
      { id: 5, name: "Elena T.", avatar: "ET", age: 22, bio: "First weekend in Philly!", mutual: 0 },
    ]
  },
  {
    id: 5,
    name: "Garage",
    type: "Rooftop Bar",
    address: "1231 N. Front St, Philadelphia",
    distance: "1.1 mi",
    vibeScore: 34,
    checkedIn: 11,
    tags: ["Rooftop", "Cocktails", "Chill"],
    color: "#00D4FF",
    trending: false,
    deal: null,
    posts: [],
    whoIsHere: [
      { id: 1, name: "Pat L.", avatar: "PL", age: 31, bio: "Just chilling", mutual: 0 },
    ]
  },
  {
    id: 6,
    name: "Cuba Libre",
    type: "Latin Club",
    address: "10 S Front St, Philadelphia",
    distance: "0.4 mi",
    vibeScore: 161,
    checkedIn: 178,
    tags: ["Latin Music", "Dancing", "Mojitos"],
    color: "#FF6B2B",
    trending: true,
    deal: {
      active: true,
      text: "2-for-1 Mojitos until midnight",
      endsAt: "12AM"
    },
    posts: [
      { id: 1, user: "Sofia R.", avatar: "SR", time: "1m ago", content: "Salsa floor is absolutely packed 🕺", likes: 52, hasMedia: true },
      { id: 2, user: "Carlos M.", avatar: "CM", time: "4m ago", content: "Live band started, this is insane", likes: 38, hasMedia: false },
      { id: 3, user: "Isabel T.", avatar: "IT", time: "9m ago", content: "Best mojito in the city no debate", likes: 29, hasMedia: false },
    ],
    whoIsHere: [
      { id: 1, name: "Sofia R.", avatar: "SR", age: 25, bio: "Salsa dancer 💃", mutual: 1 },
      { id: 2, name: "Marcus J.", avatar: "MJ", age: 28, bio: "Here every Saturday", mutual: 0 },
      { id: 3, name: "Camila V.", avatar: "CV", age: 24, bio: "Love this spot", mutual: 2 },
    ]
  },
  {
    id: 7,
    name: "Franky Bradley's",
    type: "Music Venue",
    address: "1320 Chancellor St, Philadelphia",
    distance: "0.6 mi",
    vibeScore: 119,
    checkedIn: 67,
    tags: ["Indie Music", "Full Bar", "Late Night"],
    color: "#8B5CF6",
    trending: false,
    deal: {
      active: true,
      text: "$6 well drinks all night",
      endsAt: "2AM"
    },
    posts: [
      { id: 1, user: "Drew H.", avatar: "DH", time: "6m ago", content: "Openers were fire, main act up next", likes: 17, hasMedia: false },
      { id: 2, user: "Lea M.", avatar: "LM", time: "22m ago", content: "Crowd is good energy tonight", likes: 12, hasMedia: true },
    ],
    whoIsHere: [
      { id: 1, name: "Drew H.", avatar: "DH", age: 26, bio: "Live music every weekend 🎸", mutual: 1 },
      { id: 2, name: "Nina C.", avatar: "NC", age: 24, bio: "Indie music lover", mutual: 0 },
    ]
  },
  {
    id: 8,
    name: "Harper's Garden",
    type: "Garden Bar",
    address: "31 S 18th St, Philadelphia",
    distance: "0.9 mi",
    vibeScore: 77,
    checkedIn: 34,
    tags: ["Outdoor", "Wine & Beer", "Date Night"],
    color: "#10F587",
    trending: false,
    deal: null,
    posts: [
      { id: 1, user: "Emma K.", avatar: "EK", time: "14m ago", content: "Perfect weather for the garden tonight 🌿", likes: 9, hasMedia: true },
    ],
    whoIsHere: [
      { id: 1, name: "Emma K.", avatar: "EK", age: 29, bio: "Wine & good vibes", mutual: 0 },
      { id: 2, name: "James T.", avatar: "JT", age: 31, bio: "Great spot for a date night", mutual: 1 },
    ]
  },
  {
    id: 9,
    name: "Morgan's Pier",
    type: "Waterfront Bar",
    address: "221 N Columbus Blvd, Philadelphia",
    distance: "1.4 mi",
    vibeScore: 44,
    checkedIn: 19,
    tags: ["River Views", "Beer Garden", "Casual"],
    color: "#00D4FF",
    trending: false,
    deal: null,
    posts: [
      { id: 1, user: "Leo B.", avatar: "LB", time: "35m ago", content: "Quiet night but the view is 🔥", likes: 4, hasMedia: false },
    ],
    whoIsHere: [
      { id: 1, name: "Leo B.", avatar: "LB", age: 33, bio: "Just here for the view", mutual: 0 },
    ]
  },
]

export const currentUser = {
  id: 99,
  name: "You",
  handle: "@livevibes_user",
  avatar: "ME",
  age: 24,
  bio: "Out here finding the vibe 🔥",
  checkedInAt: null,
  friends: 48,
  vibePoints: 340,
  checkIns: 12,
}

export const friends = [
  { id: 1, name: "Mia", fullName: "Mia Santos", avatar: "MS", venueId: 1, venueName: "Ladder 15" },
  { id: 2, name: "Jake", fullName: "Jake Rivera", avatar: "JR", venueId: 4, venueName: "Recess" },
  { id: 3, name: "Ashley", fullName: "Ashley R.", avatar: "AR", venueId: 1, venueName: "Ladder 15" },
  { id: 4, name: "Dana", fullName: "Dana Park", avatar: "DP", venueId: 2, venueName: "Tin Roof" },
  { id: 5, name: "Marcus", fullName: "Marcus J.", avatar: "MJ", venueId: 6, venueName: "Cuba Libre" },
]

export const liveActivity = [
  { id: 1, user: "Jordan M.", action: "checked in at", venue: "Recess", time: "30s ago", venueId: 4 },
  { id: 2, user: "Mia Santos", action: "rated 🔥 Lit at", venue: "Ladder 15", time: "1m ago", venueId: 1 },
  { id: 3, user: "Sofia R.", action: "posted at", venue: "Cuba Libre", time: "2m ago", venueId: 6 },
  { id: 4, user: "Drew H.", action: "checked in at", venue: "Franky Bradley's", time: "4m ago", venueId: 7 },
]

export const cityStats = {
  totalOut: 2847,
  activeVenues: 9,
  topNeighborhood: "Center City",
}

export const notifications = [
  {
    id: 1,
    type: "deal",
    venue: "Ladder 15",
    venueId: 1,
    message: "$5 Surfsides until 11PM — 0.2 mi from you",
    time: "3m ago",
    read: false,
    icon: "🍹"
  },
  {
    id: 2,
    type: "social",
    venue: null,
    message: "Mia Santos wants to connect with you at Ladder 15",
    time: "12m ago",
    read: false,
    icon: "👋"
  },
  {
    id: 3,
    type: "vibe",
    venue: "Recess",
    venueId: 4,
    message: "Recess just hit 168 vibes — it's absolutely lit 🔥",
    time: "18m ago",
    read: false,
    icon: "🔥"
  },
  {
    id: 4,
    type: "deal",
    venue: "Cuba Libre",
    venueId: 6,
    message: "2-for-1 Mojitos until midnight — just opened",
    time: "22m ago",
    read: false,
    icon: "🍹"
  },
  {
    id: 5,
    type: "deal",
    venue: "McGillin's",
    venueId: 3,
    message: "Trivia Night + $3 PBR starting now",
    time: "25m ago",
    read: true,
    icon: "🍺"
  },
  {
    id: 6,
    type: "social",
    venue: null,
    message: "Jake Rivera followed you",
    time: "1h ago",
    read: true,
    icon: "✨"
  },
  {
    id: 7,
    type: "vibe",
    venue: "Tin Roof",
    venueId: 2,
    message: "Tin Roof is heating up — 12 friends checked in",
    time: "2h ago",
    read: true,
    icon: "📍"
  },
]
