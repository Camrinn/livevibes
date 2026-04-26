import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { venues } from '../data/mockData'
import { getVibeLabel } from '../components/VibeScore'

export default function MapPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  // Simple visual map representation (without actual maps API)
  const positions = [
    { id: 1, x: 45, y: 52 },
    { id: 2, x: 47, y: 48 },
    { id: 3, x: 38, y: 60 },
    { id: 4, x: 55, y: 44 },
    { id: 5, x: 62, y: 35 },
  ]

  const selectedVenue = venues.find(v => v.id === selected)

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 20px 16px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}>
          Vibe Map
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Tap a spot to see the vibe
        </p>
      </div>

      {/* Map area */}
      <div style={{
        margin: '0 16px',
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        position: 'relative',
        background: '#0D1117',
        height: 320,
        flexShrink: 0,
      }}>
        {/* Grid lines (fake map) */}
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          {/* Fake streets */}
          <line x1="0" y1="40%" x2="100%" y2="38%" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
          <line x1="0" y1="65%" x2="100%" y2="62%" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
          <line x1="30%" y1="0" x2="32%" y2="100%" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
          <line x1="60%" y1="0" x2="58%" y2="100%" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
          {/* Street labels */}
          <text x="35%" y="37%" fill="rgba(255,255,255,0.15)" fontSize="9" fontFamily="DM Sans">Sansom St</text>
          <text x="35%" y="61%" fill="rgba(255,255,255,0.15)" fontSize="9" fontFamily="DM Sans">Walnut St</text>
        </svg>

        {/* Venue pins */}
        {positions.map(pos => {
          const venue = venues.find(v => v.id === pos.id)
          const { color } = getVibeLabel(venue.vibeScore)
          const isSelected = selected === pos.id
          return (
            <button
              key={pos.id}
              onClick={() => setSelected(pos.id === selected ? null : pos.id)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                zIndex: isSelected ? 10 : 5,
                transition: 'transform 0.2s ease',
              }}
            >
              {/* Pulse ring */}
              {isSelected && (
                <span style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 44, height: 44,
                  borderRadius: '50%',
                  background: `${color}22`,
                  border: `1px solid ${color}44`,
                  animation: 'pulse-dot 1.2s ease infinite',
                }} />
              )}
              {/* Pin */}
              <div style={{
                width: isSelected ? 40 : 32,
                height: isSelected ? 40 : 32,
                borderRadius: '50%',
                background: `${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isSelected ? 16 : 13,
                boxShadow: `0 0 ${isSelected ? 20 : 10}px ${color}66`,
                border: `2px solid ${isSelected ? 'white' : color}`,
                transition: 'all 0.2s ease',
              }}>
                {getVenueEmoji(venue.type)}
              </div>
              {/* Score bubble */}
              <div style={{
                position: 'absolute',
                top: -14,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--bg-primary)',
                border: `1px solid ${color}44`,
                borderRadius: 8,
                padding: '1px 5px',
                fontSize: 9,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color,
                whiteSpace: 'nowrap',
              }}>
                {venue.vibeScore}
              </div>
            </button>
          )
        })}

        {/* Current user dot */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '55%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8,
        }}>
          <div style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'var(--accent-cyan)',
            border: '2px solid white',
            boxShadow: '0 0 12px var(--accent-cyan)',
          }} />
        </div>

        {/* Map legend */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          background: 'rgba(10,10,18,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {[
            { color: '#FF6B2B', label: 'Lit' },
            { color: '#8B5CF6', label: 'Mid' },
            { color: '#44445A', label: 'Dead' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{l.label}</span>
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
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 2,
                }}>
                  {selectedVenue.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {selectedVenue.type} · {selectedVenue.checkedIn} here · {selectedVenue.distance}
                </div>
                {selectedVenue.deal?.active && (
                  <div style={{ fontSize: 12, color: '#10F587', marginTop: 4 }}>
                    🍹 {selectedVenue.deal.text}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontWeight: 800,
                    color: getVibeLabel(selectedVenue.vibeScore).color,
                    textAlign: 'right',
                  }}>
                    {selectedVenue.vibeScore}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {getVibeLabel(selectedVenue.vibeScore).label}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Venue list */}
      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        <div className="section-header">
          <span className="section-title">All Spots</span>
        </div>
        {venues.sort((a, b) => b.vibeScore - a.vibeScore).map(venue => {
          const { color, label } = getVibeLabel(venue.vibeScore)
          return (
            <div
              key={venue.id}
              onClick={() => navigate(`/venue/${venue.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 14,
                marginBottom: 8,
                background: 'var(--bg-card)',
                border: selected === venue.id ? `1px solid ${color}44` : '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 20 }}>{getVenueEmoji(venue.type)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{venue.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{venue.distance} · {venue.checkedIn} here</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color }}>{venue.vibeScore}</div>
                <div style={{ fontSize: 10, color }}>{label}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getVenueEmoji(type) {
  const map = {
    'Sports Bar': '🏈',
    'Live Music Bar': '🎸',
    'Irish Pub': '🍺',
    'Nightclub': '🎧',
    'Rooftop Bar': '🌃',
  }
  return map[type] || '🍻'
}
