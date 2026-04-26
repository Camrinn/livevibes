import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import { useVenues } from '../hooks/useVenues'
import { getVibeLabel } from '../components/VibeScore'
import { useApp } from '../context/AppContext'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const HAS_MAPBOX   = Boolean(MAPBOX_TOKEN && MAPBOX_TOKEN !== 'your_mapbox_public_token')

const VENUE_EMOJI = {
  'Sports Bar': '🏈', 'Live Music Bar': '🎸', 'Irish Pub': '🍺',
  'Nightclub': '🎧', 'Rooftop Bar': '🌃', 'Latin Club': '💃',
  'Music Venue': '🎵', 'Garden Bar': '🌿', 'Waterfront Bar': '⚓',
}

// Philadelphia center
const DEFAULT_VIEW = { longitude: -75.1652, latitude: 39.9526, zoom: 13.5 }

export default function MapPage() {
  const navigate = useNavigate()
  const { checkedInVenueId } = useApp()
  const { venues, loading } = useVenues()
  const [selected, setSelected] = useState(null)
  const [viewState, setViewState] = useState(DEFAULT_VIEW)

  const selectedVenue = venues.find(v => String(v.id) === String(selected))

  if (loading) return <LoadingState />

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
              Vibe Map
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              📍 Philadelphia · {venues.length} active venues
            </p>
          </div>
          <div style={{
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 10, padding: '6px 12px',
            fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600,
          }}>
            Live ●
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{ margin: '0 16px', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', height: 300, flexShrink: 0 }}>
        {HAS_MAPBOX ? (
          <Map
            {...viewState}
            onMove={e => setViewState(e.viewState)}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            {venues.map(venue => {
              if (!venue.lat || !venue.lng) return null
              const { color } = getVibeLabel(venue.vibeScore)
              const isSelected  = String(selected) === String(venue.id)
              const isCheckedIn = String(checkedInVenueId) === String(venue.id)
              return (
                <Marker
                  key={venue.id}
                  longitude={venue.lng}
                  latitude={venue.lat}
                  anchor="center"
                  onClick={e => { e.originalEvent.stopPropagation(); setSelected(venue.id) }}
                >
                  <div style={{
                    width: isSelected ? 44 : 32, height: isSelected ? 44 : 32,
                    borderRadius: '50%', background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isSelected ? 18 : 14,
                    boxShadow: `0 0 ${isSelected ? 24 : 12}px ${color}88`,
                    border: `2px solid ${isSelected || isCheckedIn ? 'white' : color}`,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    {VENUE_EMOJI[venue.type] || '🍻'}
                  </div>
                </Marker>
              )
            })}

            {selected && selectedVenue?.lat && (
              <Popup
                longitude={selectedVenue.lng}
                latitude={selectedVenue.lat}
                anchor="bottom"
                onClose={() => setSelected(null)}
                closeButton={false}
                style={{ padding: 0 }}
              >
                <div
                  onClick={() => navigate(`/venue/${selectedVenue.id}`)}
                  style={{
                    background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, padding: '12px 14px', cursor: 'pointer', minWidth: 160,
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#F0F0FF', marginBottom: 2 }}>
                    {selectedVenue.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#8888AA', marginBottom: 6 }}>
                    {selectedVenue.type} · {selectedVenue.checkedIn ?? 0} here
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
                    color: getVibeLabel(selectedVenue.vibeScore).color,
                  }}>
                    {selectedVenue.vibeScore}
                    <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>/ 175</span>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        ) : (
          <FakeMap venues={venues} selected={selected} setSelected={setSelected} checkedInVenueId={checkedInVenueId} />
        )}
      </div>

      {/* Selected venue bar */}
      {selectedVenue && !HAS_MAPBOX && (
        <div style={{ margin: '10px 16px 0', animation: 'fade-in-up 0.25s ease' }}>
          <div
            className="glass-card"
            style={{ padding: '14px 16px', cursor: 'pointer' }}
            onClick={() => navigate(`/venue/${selectedVenue.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>{VENUE_EMOJI[selectedVenue.type] || '🍻'}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedVenue.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {selectedVenue.checkedIn ?? 0} here{selectedVenue.deal?.active ? ' · 🍹 Deal active' : ''}
                  </div>
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                color: getVibeLabel(selectedVenue.vibeScore).color,
              }}>
                {selectedVenue.vibeScore}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Venue list */}
      <div style={{ padding: '12px 16px', overflowY: 'auto', flex: 1 }}>
        <div className="section-header">
          <span className="section-title">All Spots</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sorted by vibe</span>
        </div>
        {[...venues].sort((a, b) => b.vibeScore - a.vibeScore).map(venue => {
          const { color, short } = getVibeLabel(venue.vibeScore)
          const isCheckedIn = String(checkedInVenueId) === String(venue.id)
          return (
            <div
              key={venue.id}
              onClick={() => navigate(`/venue/${venue.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 14, marginBottom: 8,
                background: isCheckedIn ? 'rgba(16,245,135,0.06)' : 'var(--bg-card)',
                border: String(selected) === String(venue.id)
                  ? `1px solid ${color}44`
                  : isCheckedIn ? '1px solid rgba(16,245,135,0.3)' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 18 }}>{VENUE_EMOJI[venue.type] || '🍻'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  {venue.name}
                  {isCheckedIn && <span style={{ fontSize: 10, color: '#10F587', marginLeft: 6, fontWeight: 700 }}>YOU'RE HERE</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {venue.distance ?? ''} {venue.checkedIn ? `· ${venue.checkedIn} here` : ''}
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

// Fallback visual map when Mapbox token isn't configured yet
function FakeMap({ venues, selected, setSelected, checkedInVenueId }) {
  const positions = [
    { id: 1, x: 44, y: 51 }, { id: 2, x: 46, y: 46 }, { id: 3, x: 36, y: 60 },
    { id: 4, x: 54, y: 42 }, { id: 5, x: 63, y: 33 }, { id: 6, x: 57, y: 58 },
    { id: 7, x: 40, y: 40 }, { id: 8, x: 30, y: 50 }, { id: 9, x: 68, y: 48 },
  ]

  return (
    <div style={{ width: '100%', height: '100%', background: '#0C0F1A', position: 'relative' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        <line x1="0" y1="38%" x2="100%" y2="36%" stroke="rgba(255,255,255,0.07)" strokeWidth="9"/>
        <line x1="0" y1="57%" x2="100%" y2="55%" stroke="rgba(255,255,255,0.07)" strokeWidth="12"/>
        <line x1="28%" y1="0" x2="30%" y2="100%" stroke="rgba(255,255,255,0.07)" strokeWidth="8"/>
        <line x1="56%" y1="0" x2="54%" y2="100%" stroke="rgba(255,255,255,0.07)" strokeWidth="10"/>
        <text x="32%" y="35%" fill="rgba(255,255,255,0.18)" fontSize="8" fontFamily="DM Sans">Sansom St</text>
        <text x="32%" y="54%" fill="rgba(255,255,255,0.18)" fontSize="8" fontFamily="DM Sans">Walnut St</text>
      </svg>
      {positions.map(pos => {
        const venue = venues.find(v => String(v.id) === String(pos.id))
        if (!venue) return null
        const { color } = getVibeLabel(venue.vibeScore)
        const isSelected  = String(selected) === String(pos.id)
        const isCheckedIn = String(checkedInVenueId) === String(pos.id)
        return (
          <button key={pos.id} onClick={() => setSelected(pos.id === selected ? null : pos.id)} style={{
            position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            zIndex: isSelected ? 10 : 5, transition: 'transform 0.2s ease',
          }}>
            {(isSelected || isCheckedIn) && (
              <span style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 48, height: 48, borderRadius: '50%',
                background: `${color}22`, border: `1px solid ${color}44`,
                animation: 'pulse-ring 1.5s ease infinite',
              }} />
            )}
            <div style={{
              width: isSelected ? 42 : 30, height: isSelected ? 42 : 30,
              borderRadius: '50%', background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isSelected ? 16 : 12,
              boxShadow: `0 0 ${isSelected ? 22 : 10}px ${color}77`,
              border: `2px solid ${isSelected || isCheckedIn ? 'white' : color}`,
              transition: 'all 0.2s ease',
            }}>
              {VENUE_EMOJI[venue.type] || '🍻'}
            </div>
            <div style={{
              position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg-primary)', border: `1px solid ${color}44`,
              borderRadius: 8, padding: '1px 5px',
              fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-display)', color,
              whiteSpace: 'nowrap',
            }}>
              {venue.vibeScore}
            </div>
          </button>
        )
      })}
      <div style={{ position: 'absolute', left: '50%', top: '55%', transform: 'translate(-50%, -50%)', zIndex: 8 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--accent-cyan)', border: '2px solid white', boxShadow: '0 0 12px var(--accent-cyan)' }} />
      </div>
      {/* Mapbox CTA */}
      <div style={{
        position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(10,10,18,0.9)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '6px 12px', whiteSpace: 'nowrap',
        fontSize: 11, color: 'var(--text-muted)',
      }}>
        Add Mapbox token to see real map
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: 'pulse-dot 1.4s ease infinite' }}>🗺️</div>
        <div>Loading map...</div>
      </div>
    </div>
  )
}
