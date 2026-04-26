import React from 'react'
import { useNavigate } from 'react-router-dom'
import VibeScore from './VibeScore'
import { useGoingTonight } from '../hooks/useGoingTonight'
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

export default function VenueCard({ venue, index = 0 }) {
  const navigate = useNavigate()
  const { user } = useApp()
  const { isGoing, count, toggle } = useGoingTonight(venue.id, user?.id)

  return (
    <div
      className="glass-card animate-in"
      style={{
        padding: '16px',
        marginBottom: 12,
        cursor: 'pointer',
        animationDelay: `${index * 0.06}s`,
        animationFillMode: 'both',
        transition: 'transform 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={() => navigate(`/venue/${venue.id}`)}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.99)'}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Accent glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 120, height: 120, borderRadius: '50%',
        background: venue.color, opacity: 0.05,
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      {venue.trending && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(255,59,92,0.15)', border: '1px solid rgba(255,59,92,0.3)',
          borderRadius: 999, padding: '2px 8px',
          fontSize: 9, color: '#FF3B5C', fontWeight: 700, letterSpacing: '0.5px',
          fontFamily: 'var(--font-display)',
        }}>
          TRENDING ↑
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: `${venue.color}22`, border: `1.5px solid ${venue.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 22,
        }}>
          {VENUE_EMOJI[venue.type] || '🍻'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
              color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {venue.name}
            </span>
            {venue.deal?.active && (
              <span style={{
                background: 'rgba(16,245,135,0.15)', color: '#10F587',
                border: '1px solid rgba(16,245,135,0.3)', borderRadius: 6,
                fontSize: 9, fontWeight: 700, padding: '2px 6px',
                letterSpacing: '0.5px', flexShrink: 0,
              }}>
                DEAL
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{venue.type}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{venue.distance}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{venue.checkedIn} here</span>
            {count > 0 && (
              <>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
                <span style={{ fontSize: 12, color: '#8B5CF6' }}>{count} going</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', overflow: 'hidden' }}>
            {venue.tags.slice(0, 2).map(tag => (
              <span key={tag} className="chip" style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary)', border: '1px solid var(--border)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <VibeScore score={venue.vibeScore} size="sm" />
      </div>

      {/* Bottom row: deal + Going Tonight button */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        {venue.deal?.active && (
          <div style={{
            flex: 1, padding: '8px 12px', borderRadius: 10,
            background: 'rgba(16,245,135,0.08)', border: '1px solid rgba(16,245,135,0.15)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>🍹</span>
            <span style={{ fontSize: 12, color: '#10F587', fontWeight: 500 }}>{venue.deal.text}</span>
          </div>
        )}
        {!venue.deal?.active && <div style={{ flex: 1 }} />}

        <button
          onClick={e => { e.stopPropagation(); toggle() }}
          style={{
            flexShrink: 0,
            padding: '7px 12px', borderRadius: 10,
            border: isGoing ? '1px solid rgba(139,92,246,0.5)' : '1px solid var(--border)',
            background: isGoing ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
            color: isGoing ? '#8B5CF6' : 'var(--text-muted)',
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {isGoing ? '✓ Going' : '🗓 Going?'}
        </button>
      </div>
    </div>
  )
}
