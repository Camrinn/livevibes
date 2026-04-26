import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VenueCard from '../components/VenueCard'
import { getVibeLabel } from '../components/VibeScore'
import { useVenues } from '../hooks/useVenues'
import { useLiveActivity } from '../hooks/useLiveActivity'
import { useApp } from '../context/AppContext'
import { useCheckin } from '../hooks/useCheckin'

const FILTERS = ['All', 'Lit 🔥', 'Vibing 😎', 'Deals 🍹', 'Nearby 📍', 'Clubs 🎧']

const VENUE_EMOJI = {
  'Sports Bar': '🏈',
  'Live Music Bar': '🎸',
  'Irish Pub': '🍺',
  'Nightclub': '🎧',
  'Rooftop Bar': '🌃',
  'Latin Club': '💃',
  'Music Venue': '🎵',
  'Garden Bar': '🌿',
  'Waterfront Bar': '⚓',
}

const STALE_HOURS = 4

export default function Home() {
  const [filter, setFilter]           = useState('All')
  const [search, setSearch]           = useState('')
  const [staleDismissed, setStaleDismissed] = useState(false)
  const navigate = useNavigate()

  const { venues } = useVenues()
  const { user, checkedInVenueId, checkedInAt, checkOut } = useApp()
  const { checkOut: doCheckOut } = useCheckin()
  const { activity, friendsOut, peopleOut } = useLiveActivity(user?.id)

  const staleVenue = checkedInVenueId
    ? venues.find(v => String(v.id) === String(checkedInVenueId))
    : null
  const isStale = !staleDismissed &&
    checkedInAt &&
    (Date.now() - new Date(checkedInAt)) > STALE_HOURS * 60 * 60 * 1000

  async function handleStillHere() {
    setStaleDismissed(true)
  }

  async function handleStaleCheckOut() {
    await doCheckOut(user?.id)
    checkOut()
    setStaleDismissed(true)
  }

  const hotVenue = [...venues].sort((a, b) => b.vibeScore - a.vibeScore)[0]

  const filteredVenues = venues.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.type.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'Lit 🔥') return v.vibeScore >= 151
    if (filter === 'Vibing 😎') return v.vibeScore >= 101 && v.vibeScore < 151
    if (filter === 'Deals 🍹') return v.deal?.active
    if (filter === 'Nearby 📍') return parseFloat(v.distance) < 0.5
    if (filter === 'Clubs 🎧') return v.type === 'Nightclub' || v.type === 'Latin Club'
    return true
  }).sort((a, b) => b.vibeScore - a.vibeScore)

  const tierCounts = [
    { label: 'Lit', count: venues.filter(v => v.vibeScore >= 151).length, color: '#FF6B2B' },
    { label: 'Vibing', count: venues.filter(v => v.vibeScore >= 101 && v.vibeScore < 151).length, color: '#8B5CF6' },
    { label: 'Mid', count: venues.filter(v => v.vibeScore >= 51 && v.vibeScore < 101).length, color: '#00D4FF' },
    { label: 'Dead', count: venues.filter(v => v.vibeScore < 51).length, color: '#44445A' },
  ]

  return (
    <div className="page">
      {/* Sticky Header */}
      <div style={{
        padding: '52px 20px 0',
        position: 'sticky',
        top: 0,
        background: 'rgba(10,10,18,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 10,
        paddingBottom: 12,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                fontWeight: 800,
                background: 'linear-gradient(90deg, #FF6B2B, #FF3B5C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
              }}>
                Live Vibes
              </span>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,59,92,0.15)',
                border: '1px solid rgba(255,59,92,0.3)',
                borderRadius: 999,
                padding: '2px 8px',
                fontSize: 10,
                color: '#FF3B5C',
                fontWeight: 700,
                letterSpacing: '1px',
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#FF3B5C',
                  animation: 'pulse-dot 1.4s ease infinite',
                  display: 'inline-block',
                }} />
                LIVE
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              📍 Philadelphia · {peopleOut.toLocaleString()} people out tonight
            </p>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,107,43,0.2), rgba(139,92,246,0.2))',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="input-field"
            style={{ paddingLeft: 38 }}
            placeholder="Search bars, clubs, venues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 999,
                border: filter === f ? '1px solid var(--accent-cyan)' : '1px solid var(--border)',
                background: filter === f ? 'rgba(0,212,255,0.1)' : 'var(--bg-card)',
                color: filter === f ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stale check-in banner */}
      {isStale && staleVenue && (
        <div style={{
          margin: '8px 16px 0',
          padding: '12px 16px',
          borderRadius: 14,
          background: 'rgba(255,107,43,0.08)',
          border: '1px solid rgba(255,107,43,0.25)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B2B' }}>Still at {staleVenue.name}?</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>You checked in {STALE_HOURS}+ hours ago</div>
          </div>
          <button
            onClick={handleStillHere}
            style={{
              padding: '5px 10px', borderRadius: 8,
              border: '1px solid rgba(255,107,43,0.3)',
              background: 'rgba(255,107,43,0.1)',
              color: '#FF6B2B', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Still here
          </button>
          <button
            onClick={handleStaleCheckOut}
            style={{
              padding: '5px 10px', borderRadius: 8,
              border: '1px solid rgba(255,59,92,0.3)',
              background: 'rgba(255,59,92,0.08)',
              color: '#FF3B5C', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Check out
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '0 16px 20px' }}>

        {/* Friends activity row */}
        {filter === 'All' && !search && friendsOut.length > 0 && (
          <div style={{ marginBottom: 20, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px',
              }}>
                Friends Out Tonight
              </span>
              <span style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>
                {friendsOut.length} active
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {friendsOut.map(f => {
                const venue = venues.find(v => String(v.id) === String(f.venueId))
                const { color } = getVibeLabel(venue?.vibeScore || 0)
                return (
                  <div
                    key={f.id}
                    onClick={() => navigate(`/venue/${f.venueId}`)}
                    style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(255,107,43,0.25), rgba(139,92,246,0.25))',
                      border: `2.5px solid ${color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                      color: 'var(--text-primary)', boxShadow: `0 0 14px ${color}44`, marginBottom: 6,
                    }}>
                      {f.avatar}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: 10, color, marginTop: 1 }}>
                      {(f.venueName ?? '').split(' ')[0]}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Hot Tonight hero card */}
        {filter === 'All' && !search && hotVenue && (
          <div
            onClick={() => navigate(`/venue/${hotVenue.id}`)}
            className="animate-in"
            style={{
              borderRadius: 24,
              padding: '20px',
              marginBottom: 20,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${hotVenue.color}22 0%, ${hotVenue.color}08 100%)`,
              border: `1px solid ${hotVenue.color}33`,
            }}
          >
            {/* Background glow */}
            <div style={{
              position: 'absolute', top: -30, right: -30,
              width: 160, height: 160, borderRadius: '50%',
              background: hotVenue.color,
              opacity: 0.08,
              filter: 'blur(50px)',
              pointerEvents: 'none',
            }} />

            {/* Badge */}
            <div style={{
              position: 'absolute', top: 14, right: 14,
              background: hotVenue.color,
              color: 'white',
              fontSize: 10,
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 999,
              letterSpacing: '1px',
              fontFamily: 'var(--font-display)',
            }}>
              🔥 HOTTEST SPOT
            </div>

            <div style={{ fontSize: 36, marginBottom: 10 }}>
              {VENUE_EMOJI[hotVenue.type] || '🍻'}
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 4,
              lineHeight: 1.1,
            }}>
              {hotVenue.name}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              {hotVenue.type} · {hotVenue.checkedIn} people here now · {hotVenue.distance}
            </p>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 52,
                  fontWeight: 800,
                  color: hotVenue.color,
                  lineHeight: 1,
                  letterSpacing: '-2px',
                  filter: `drop-shadow(0 0 16px ${hotVenue.color}66)`,
                }}>
                  {hotVenue.vibeScore}
                </span>
                <span style={{ fontSize: 14, color: hotVenue.color, fontWeight: 600, opacity: 0.7 }}>
                  / 175
                </span>
              </div>
              {hotVenue.deal?.active && (
                <div style={{
                  background: 'rgba(16,245,135,0.12)',
                  border: '1px solid rgba(16,245,135,0.3)',
                  borderRadius: 12,
                  padding: '8px 12px',
                  maxWidth: 160,
                }}>
                  <span style={{ fontSize: 12, color: '#10F587', fontWeight: 600 }}>
                    🍹 {hotVenue.deal.text}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tier summary bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {tierCounts.map(s => (
            <div key={s.label} className="glass-card" style={{ flex: 1, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{
                fontSize: 18, fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: s.color,
              }}>
                {s.count}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Live activity feed */}
        {filter === 'All' && !search && activity.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div className="section-header">
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px',
              }}>
                Live Activity
              </span>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: '#10F587', fontWeight: 600,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%', background: '#10F587',
                  animation: 'pulse-dot 1.4s ease infinite', display: 'inline-block',
                }} />
                LIVE
              </span>
            </div>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, overflow: 'hidden',
            }}>
              {activity.map((item, i) => {
                const initials = (item.userName ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/venue/${item.venueId}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                      borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(255,107,43,0.25), rgba(139,92,246,0.25))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)',
                      color: 'var(--text-primary)', flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{item.userName}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}> {item.action} </span>
                      <span style={{ fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 600 }}>{item.venueName}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{item.time}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Venue list */}
        <div className="section-header">
          <span className="section-title">
            {filter === 'All' ? 'Nearby Spots' : filter}
          </span>
          <span className="section-action">{filteredVenues.length} places</span>
        </div>

        {filteredVenues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💀</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>No spots found</div>
            <div style={{ fontSize: 13 }}>Try a different filter</div>
          </div>
        ) : (
          filteredVenues.map((venue, i) => (
            <VenueCard key={venue.id} venue={venue} index={i} />
          ))
        )}
      </div>
    </div>
  )
}
