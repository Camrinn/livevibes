import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { venues } from '../data/mockData'
import { getVibeLabel } from '../components/VibeScore'
import { useApp } from '../context/AppContext'

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

const positions = [
  { id: 1, x: 44, y: 51 },
  { id: 2, x: 46, y: 46 },
  { id: 3, x: 36, y: 60 },
  { id: 4, x: 54, y: 42 },
  { id: 5, x: 63, y: 33 },
  { id: 6, x: 57, y: 58 },
  { id: 7, x: 40, y: 40 },
  { id: 8, x: 30, y: 50 },
  { id: 9, x: 68, y: 48 },
]

export default function MapPage() {
  const navigate = useNavigate()
  const { checkedInVenueId } = useApp()
  const [selected, setSelected] = useState(null)

  const selectedVenue = venues.find(v => v.id === selected)

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800,
              color: 'var(--text-primary)', marginBottom: 2,
            }}>
              Vibe Map
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              📍 Philadelphia · {venues.length} active venues
            </p>
          </div>
          <div style={{
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 10, padding: '6px 12px',
            fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600,
          }}>
            Live ●
          </div>
        </div>
      </div>

      {/* Map area */}
      <div style={{
        margin: '0 16px',
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        position: 'relative',
        background: '#0C0F1A',
        height: 300,
        flexShrink: 0,
      }}>
        {/* Grid + streets */}
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          {/* Streets */}
          <line x1="0" y1="38%" x2="100%" y2="36%" stroke="rgba(255,255,255,0.07)" strokeWidth="9"/>
          <line x1="0" y1="57%" x2="100%" y2="55%" stroke="rgba(255,255,255,0.07)" strokeWidth="12"/>
          <line x1="28%" y1="0" x2="30%" y2="100%" stroke="rgba(255,255,255,0.07)" strokeWidth="8"/>
          <line x1="56%" y1="0" x2="54%" y2="100%" stroke="rgba(255,255,255,0.07)" strokeWidth="10"/>
          <line x1="75%" y1="0" x2="73%" y2="100%" stroke="rgba(255,255,255,0.04)" strokeWidth="6"/>
          {/* Street labels */}
          <text x="32%" y="35%" fill="rgba(255,255,255,0.18)" fontSize="8" fontFamily="DM Sans">Sansom St</text>
          <text x="32%" y="54%" fill="rgba(255,255,255,0.18)" fontSize="8" fontFamily="DM Sans">Walnut St</text>
          <text x="2%" y="54%" fill="rgba(255,255,255,0.18)" fontSize="8" fontFamily="DM Sans" transform="rotate(-90,12,160)">Broad</text>
        </svg>

        {/* Venue pins */}
        {positions.map(pos => {
          const venue = venues.find(v => v.id === pos.id)
          if (!venue) return null
          const { color } = getVibeLabel(venue.vibeScore)
          const isSelected = selected === pos.id
          const isCheckedIn = checkedInVenueId === pos.id
          return (
            <button
              key={pos.id}
              onClick={() => setSelected(pos.id === selected ? null : pos.id)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                background: 'none', border: 'none',
                cursor: 'pointer',
                zIndex: isSelected ? 10 : 5,
                transition: 'transform 0.2s ease',
              }}
            >
              {/* Pulse ring */}
              {(isSelected || isCheckedIn) && (
                <span style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 48, height: 48, borderRadius: '50%',
                  background: `${color}22`,
                  border: `1px solid ${color}44`,
                  animation: 'pulse-ring 1.5s ease infinite',
                }} />
              )}
              {/* Pin */}
              <div style={{
                width: isSelected ? 42 : 30,
                height: isSelected ? 42 : 30,
                borderRadius: '50%',
                background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isSelected ? 16 : 12,
                boxShadow: `0 0 ${isSelected ? 22 : 10}px ${color}77`,
                border: `2px solid ${isSelected ? 'white' : color}`,
                transition: 'all 0.2s ease',
              }}>
                {VENUE_EMOJI[venue.type] || '🍻'}
              </div>
              {/* Score bubble */}
              <div style={{
                position: 'absolute', top: -16, left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--bg-primary)',
                border: `1px solid ${color}44`,
                borderRadius: 8, padding: '1px 5px',
                fontSize: 9, fontWeight: 700,
                fontFamily: 'var(--font-display)', color,
                whiteSpace: 'nowrap',
              }}>
                {venue.vibeScore}
              </div>
            </button>
          )
        })}

        {/* Current user dot */}
        <div style={{
          position: 'absolute', left: '50%', top: '55%',
          transform: 'translate(-50%, -50%)', zIndex: 8,
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%',
            background: 'var(--accent-cyan)',
            border: '2px solid white',
            boxShadow: '0 0 12px var(--accent-cyan)',
          }} />
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          background: 'rgba(10,10,18,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
          borderRadius: 12, padding: '8px 10px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {[
            { color: '#FF6B2B', label: 'Lit 🔥' },
            { color: '#8B5CF6', label: 'Vibing' },
            { color: '#00D4FF', label: 'Mid' },
            { color: '#44445A', label: 'Dead' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected venue card */}
      {selectedVenue && (
        <div style={{ margin: '12px 16px 0', animation: 'fade-in-up 0.25s ease' }}>
          <div
            className="glass-card"
            style={{ padding: '14px 16px', cursor: 'pointer' }}
            onClick={() => navigate(`/venue/${selectedVenue.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 24 }}>{VENUE_EMOJI[selectedVenue.type] || '🍻'}</span>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
                    color: 'var(--text-primary)', marginBottom: 2,
                  }}>
                    {selectedVenue.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {selectedVenue.type} · {selectedVenue.checkedIn} here · {selectedVenue.distance}
                  </div>
                  {selectedVenue.deal?.active && (
                    <div style={{ fontSize: 12, color: '#10F587', marginTop: 3 }}>
                      🍹 {selectedVenue.deal.text}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                    color: getVibeLabel(selectedVenue.vibeScore).color,
                  }}>
                    {selectedVenue.vibeScore}
                  </div>
                  <div style={{ fontSize: 10, color: getVibeLabel(selectedVenue.vibeScore).color }}>
                    {getVibeLabel(selectedVenue.vibeScore).short}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Venue list */}
      <div style={{ padding: '12px 16px', overflowY: 'auto', flex: 1 }}>
        <div className="section-header">
          <span className="section-title">All Spots</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Sorted by vibe
          </span>
        </div>
        {[...venues].sort((a, b) => b.vibeScore - a.vibeScore).map(venue => {
          const { color, short } = getVibeLabel(venue.vibeScore)
          const isCheckedIn = checkedInVenueId === venue.id
          return (
            <div
              key={venue.id}
              onClick={() => navigate(`/venue/${venue.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 14, marginBottom: 8,
                background: isCheckedIn ? 'rgba(16,245,135,0.06)' : 'var(--bg-card)',
                border: selected === venue.id ? `1px solid ${color}44` : isCheckedIn ? '1px solid rgba(16,245,135,0.3)' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 18 }}>{VENUE_EMOJI[venue.type] || '🍻'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  {venue.name}
                  {isCheckedIn && (
                    <span style={{ fontSize: 10, color: '#10F587', marginLeft: 6, fontWeight: 700 }}>YOU'RE HERE</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {venue.distance} · {venue.checkedIn} here
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color }}>{venue.vibeScore}</div>
                <div style={{ fontSize: 9, color, fontWeight: 700 }}>{short}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
