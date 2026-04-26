import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { currentUser, venues } from '../data/mockData'
import { useApp } from '../context/AppContext'
import { getVibeLabel } from '../components/VibeScore'

export default function Profile() {
  const navigate = useNavigate()
  const { checkedInVenueId, checkOut, vibePoints, checkInCount } = useApp()
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState(currentUser.bio)
  const [tempBio, setTempBio] = useState(bio)

  const currentVenue = venues.find(v => v.id === checkedInVenueId)
  const recentVenues = venues.slice(0, 3)

  return (
    <div className="page">
      {/* Header */}
      <div style={{
        padding: '52px 20px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(255,107,43,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
          <div style={{
            width: 84, height: 84, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B2B, #FF3B5C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
            color: 'white',
            boxShadow: '0 0 30px rgba(255,107,43,0.4)',
          }}>
            {currentUser.avatar}
          </div>
          {/* Online indicator */}
          <div style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 16, height: 16, borderRadius: '50%',
            background: '#10F587',
            border: '2px solid var(--bg-primary)',
            boxShadow: '0 0 8px #10F587',
          }} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
          color: 'var(--text-primary)', marginBottom: 2,
        }}>
          {currentUser.name}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
          {currentUser.handle}
        </p>

        {/* Current location */}
        {currentVenue && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(16,245,135,0.1)',
            border: '1px solid rgba(16,245,135,0.3)',
            borderRadius: 999, padding: '4px 12px',
            marginBottom: 12,
            cursor: 'pointer',
          }}
            onClick={() => navigate(`/venue/${currentVenue.id}`)}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#10F587',
              animation: 'pulse-dot 1.4s ease infinite',
            }} />
            <span style={{ fontSize: 12, color: '#10F587', fontWeight: 600 }}>
              At {currentVenue.name}
            </span>
            <button
              onClick={e => { e.stopPropagation(); checkOut() }}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(16,245,135,0.6)', fontSize: 11,
                cursor: 'pointer', marginLeft: 2,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Bio */}
        {editing ? (
          <div style={{ marginBottom: 12 }}>
            <textarea
              value={tempBio}
              onChange={e => setTempBio(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-active)',
                borderRadius: 12,
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 14, textAlign: 'center',
                resize: 'none', outline: 'none', minHeight: 60,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => { setBio(tempBio); setEditing(false) }}>Save</button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14 }}>{bio}</p>
        )}

        {!editing && (
          <button
            className="btn-secondary"
            style={{ maxWidth: 200, margin: '0 auto' }}
            onClick={() => { setTempBio(bio); setEditing(true) }}
          >
            Edit Profile
          </button>
        )}
      </div>

      <div style={{ padding: '20px 16px 100px' }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Vibe Points', value: vibePoints, icon: '⚡', color: '#FF6B2B' },
            { label: 'Friends', value: currentUser.friends, icon: '👥', color: '#8B5CF6' },
            { label: 'Check-ins', value: checkInCount, icon: '📍', color: '#00D4FF' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ flex: 1, padding: '14px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
                color: s.color, lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Vibe points explainer */}
        <div style={{
          padding: '12px 14px', borderRadius: 14, marginBottom: 24,
          background: 'rgba(255,107,43,0.06)',
          border: '1px solid rgba(255,107,43,0.15)',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#FF6B2B' }}>Earn More Vibe Points</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Check in (+20) · Post an update (+15) · Rate a venue (+10)
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="section-header">
          <span className="section-title">Badges</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>3/5 earned</span>
        </div>
        <div style={{
          display: 'flex', gap: 12, marginBottom: 24,
          overflowX: 'auto', paddingBottom: 4,
        }}>
          {[
            { icon: '🔥', label: 'Lit Regular', earned: true, sub: 'At 5+ lit venues' },
            { icon: '🌃', label: 'Night Owl', earned: true, sub: 'Out after 2AM' },
            { icon: '📍', label: 'Explorer', earned: true, sub: '10+ check-ins' },
            { icon: '🏆', label: 'Top Rater', earned: false, sub: '50+ ratings' },
            { icon: '👑', label: 'Ambassador', earned: false, sub: 'Invite 10 friends' },
          ].map(b => (
            <div key={b.label} style={{
              flexShrink: 0, textAlign: 'center', width: 70,
              opacity: b.earned ? 1 : 0.35,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: b.earned ? 'rgba(255,107,43,0.15)' : 'var(--bg-card)',
                border: b.earned ? '1px solid rgba(255,107,43,0.3)' : '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginBottom: 6, marginLeft: 'auto', marginRight: 'auto',
              }}>
                {b.icon}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.3 }}>
                {b.label}
              </div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="section-header">
          <span className="section-title">Recent Activity</span>
        </div>
        {recentVenues.map((venue, i) => {
          const { color } = getVibeLabel(venue.vibeScore)
          return (
            <div
              key={venue.id}
              onClick={() => navigate(`/venue/${venue.id}`)}
              style={{
                display: 'flex', gap: 12, padding: '12px 14px',
                borderRadius: 14, marginBottom: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                alignItems: 'center', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>{
                { 'Sports Bar': '🏈', 'Live Music Bar': '🎸', 'Irish Pub': '🍺' }[venue.type] || '🍻'
              }</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{venue.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Checked in · {i === 0 ? 'Yesterday' : `${i + 1} days ago`}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#FF6B2B',
                background: 'rgba(255,107,43,0.1)',
                padding: '3px 8px', borderRadius: 8,
              }}>
                +20 pts
              </span>
            </div>
          )
        })}

        {/* Settings */}
        <div className="section-header" style={{ marginTop: 24 }}>
          <span className="section-title">Settings</span>
        </div>
        {[
          { icon: '🔔', label: 'Push Notifications', sub: 'Deals, vibes, and friend activity', toggle: true },
          { icon: '📍', label: 'Location', sub: 'Required for check-ins and posts', toggle: true },
          { icon: '👁', label: "Visibility on Who's Here", sub: 'Let others see you at venues', toggle: true },
          { icon: '🔒', label: 'Privacy', sub: 'Who can see your profile' },
          { icon: '🚪', label: 'Log Out', sub: 'Sign out of your account', danger: true },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', gap: 12, padding: '14px 16px',
            borderRadius: 14, marginBottom: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            alignItems: 'center', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 600, fontSize: 14,
                color: s.danger ? '#FF3B5C' : 'var(--text-primary)',
              }}>
                {s.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.sub}</div>
            </div>
            {s.toggle ? (
              <div style={{
                width: 40, height: 22, borderRadius: 999,
                background: 'rgba(0,212,255,0.2)',
                border: '1px solid rgba(0,212,255,0.3)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--accent-cyan)',
                }} />
              </div>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
