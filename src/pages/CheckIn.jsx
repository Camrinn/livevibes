import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { venues } from '../data/mockData'
import { useApp } from '../context/AppContext'
import { getVibeLabel } from '../components/VibeScore'

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

export default function CheckIn() {
  const navigate = useNavigate()
  const { checkedInVenueId, checkIn, checkOut } = useApp()
  const [step, setStep] = useState('select')
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [vibe, setVibe] = useState(null)

  const currentVenue = venues.find(v => v.id === checkedInVenueId)

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue)
    setStep('rating')
  }

  const handleSubmit = () => {
    checkIn(selectedVenue.id)
    setStep('done')
    setTimeout(() => navigate(`/venue/${selectedVenue.id}`), 1800)
  }

  const handleCheckOut = () => {
    checkOut()
  }

  if (step === 'done') {
    return (
      <div className="page" style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '80vh', textAlign: 'center', padding: 32,
      }}>
        <div style={{ fontSize: 80, marginBottom: 20, animation: 'float 2s ease infinite' }}>🔥</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800,
          color: 'var(--text-primary)', marginBottom: 8,
        }}>
          You're Checked In!
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 4, fontSize: 16 }}>
          {selectedVenue?.name}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>+20 vibe points earned</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Taking you to the venue page...
        </p>
      </div>
    )
  }

  if (step === 'rating') {
    return (
      <div className="page">
        <div style={{ padding: '52px 20px 0' }}>
          <button
            onClick={() => setStep('select')}
            style={{
              background: 'none', border: 'none',
              color: 'var(--accent-cyan)', cursor: 'pointer',
              fontSize: 14, marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            ← Back
          </button>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
            color: 'var(--text-primary)', marginBottom: 6,
          }}>
            What's the vibe?
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: 14 }}>
            At <strong style={{ color: 'var(--text-primary)' }}>{selectedVenue.name}</strong> right now
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 28 }}>
            Your rating helps others decide where to go tonight
          </p>
        </div>

        <div style={{ padding: '0 20px 100px' }}>
          {[
            { label: '🔥', title: 'Lit', sub: 'Absolutely packed, high energy', value: 'lit', color: '#FF6B2B', range: '151–175' },
            { label: '😎', title: 'Vibing', sub: 'Good energy, getting there', value: 'vibing', color: '#8B5CF6', range: '101–150' },
            { label: '😐', title: 'Mid', sub: 'Decent but nothing special', value: 'mid', color: '#00D4FF', range: '51–100' },
            { label: '💀', title: 'Dead', sub: 'Empty, quiet, not the move', value: 'dead', color: '#44445A', range: '0–50' },
          ].map(r => (
            <div
              key={r.value}
              onClick={() => setVibe(r.value)}
              style={{
                padding: '18px 20px', borderRadius: 20, marginBottom: 12,
                border: vibe === r.value ? `2px solid ${r.color}` : '1.5px solid var(--border)',
                background: vibe === r.value ? `${r.color}15` : 'var(--bg-card)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 38 }}>{r.label}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800,
                  color: vibe === r.value ? r.color : 'var(--text-primary)',
                }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 1 }}>{r.sub}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.range}</div>
                {vibe === r.value && (
                  <div style={{
                    marginTop: 4,
                    width: 22, height: 22, borderRadius: '50%',
                    background: r.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 12, marginLeft: 'auto',
                  }}>
                    ✓
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            className="btn-primary"
            style={{ marginTop: 8, opacity: vibe ? 1 : 0.4 }}
            onClick={vibe ? handleSubmit : undefined}
          >
            Check In & Submit Rating
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ padding: '52px 20px 0' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
          color: 'var(--text-primary)', marginBottom: 6,
        }}>
          Check In
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
          Where are you right now?
        </p>
      </div>

      <div style={{ padding: '0 16px 100px' }}>
        {/* Currently checked in */}
        {currentVenue && (
          <div style={{
            padding: '14px 16px', borderRadius: 16, marginBottom: 20,
            background: 'rgba(16,245,135,0.08)',
            border: '1px solid rgba(16,245,135,0.3)',
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <span style={{ fontSize: 24 }}>✓</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10F587' }}>Currently Checked In</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 1 }}>{currentVenue.name}</div>
            </div>
            <button
              onClick={handleCheckOut}
              style={{
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid rgba(255,59,92,0.3)',
                background: 'rgba(255,59,92,0.08)',
                color: '#FF3B5C',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              Check Out
            </button>
          </div>
        )}

        {/* Location note */}
        <div style={{
          padding: '12px 16px', borderRadius: 14,
          background: 'rgba(0,212,255,0.06)',
          border: '1px solid rgba(0,212,255,0.15)',
          marginBottom: 20,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)' }}>Nearby Venues</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sorted by distance from you</div>
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
          color: 'var(--text-secondary)', letterSpacing: '0.8px',
          textTransform: 'uppercase', marginBottom: 12,
        }}>
          Select your spot
        </div>

        {[...venues].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)).map(venue => {
          const { color } = getVibeLabel(venue.vibeScore)
          const isCurrentlyHere = checkedInVenueId === venue.id
          return (
            <div
              key={venue.id}
              onClick={() => handleVenueSelect(venue)}
              style={{
                padding: '14px 16px', borderRadius: 16, marginBottom: 10,
                background: isCurrentlyHere ? 'rgba(16,245,135,0.06)' : 'var(--bg-card)',
                border: isCurrentlyHere ? '1px solid rgba(16,245,135,0.3)' : '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all 0.15s',
              }}
              onTouchStart={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onTouchEnd={e => e.currentTarget.style.background = isCurrentlyHere ? 'rgba(16,245,135,0.06)' : 'var(--bg-card)'}
            >
              <span style={{ fontSize: 24 }}>{VENUE_EMOJI[venue.type] || '🍻'}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 700, fontSize: 15,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                }}>
                  {venue.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {venue.type} · {venue.distance} · {venue.checkedIn} here
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16, fontWeight: 800, color,
                }}>
                  {venue.vibeScore}
                </div>
                {isCurrentlyHere && (
                  <div style={{ fontSize: 10, color: '#10F587', marginTop: 2 }}>HERE ✓</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
