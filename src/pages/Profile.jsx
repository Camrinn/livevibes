import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getVibeLabel } from '../components/VibeScore'
import { supabase, isConfigured } from '../lib/supabase'
import { useVenues } from '../hooks/useVenues'

const APP_URL = 'https://live-vibes.vercel.app'

function InviteCard({ user }) {
  const [copied, setCopied] = useState(false)
  const inviteCode = user?.inviteCode ?? user?.id?.slice(0, 8) ?? null
  const inviteLink = inviteCode ? `${APP_URL}/join/${inviteCode}` : null

  async function handleShare() {
    if (!inviteLink) return
    const shareData = {
      title: 'Live Vibes',
      text: `I'm using Live Vibes to track the best bars in Philly tonight! 🔥 Join me:`,
      url: inviteLink,
    }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch (_) {}
    } else {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div style={{
      padding: '16px', borderRadius: 16, marginBottom: 8,
      background: 'linear-gradient(135deg, rgba(255,107,43,0.08), rgba(139,92,246,0.08))',
      border: '1px solid rgba(255,107,43,0.2)',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>🔥</span>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>
            Bring your crew
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            +50 Vibe Points for you and your friend when they join
          </div>
        </div>
      </div>
      {inviteLink && (
        <div style={{
          background: 'var(--bg-primary)', borderRadius: 10, padding: '8px 12px',
          border: '1px solid var(--border)', marginBottom: 10,
          fontSize: 12, color: 'var(--text-muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {inviteLink}
        </div>
      )}
      <button
        className="btn-primary"
        onClick={handleShare}
        style={{ fontSize: 14 }}
      >
        {copied ? '✓ Link Copied!' : '📤 Share Invite Link'}
      </button>
    </div>
  )
}

const MODE_OPTIONS = [
  { value: 'friends', emoji: '👥', label: 'Friends Mode', color: '#00D4FF' },
  { value: 'vibing',  emoji: '😎', label: 'Vibing',       color: '#8B5CF6' },
  { value: 'connect', emoji: '🔥', label: 'Connect',      color: '#FF6B2B' },
]

function timeAgo(ts) {
  if (!ts) return ''
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

const VENUE_EMOJI = {
  'Sports Bar': '🏈', 'Live Music Bar': '🎸', 'Irish Pub': '🍺',
  'Nightclub': '🎧', 'Rooftop Bar': '🌃', 'Latin Club': '💃',
  'Music Venue': '🎵', 'Garden Bar': '🌿', 'Waterfront Bar': '⚓',
}

function Toggle({ on }) {
  return (
    <div style={{
      width: 40, height: 22, borderRadius: 999, position: 'relative',
      background: on ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.08)',
      border: on ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--border)',
      transition: 'all 0.2s',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2,
        left: on ? 'calc(100% - 18px)' : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: on ? 'var(--accent-cyan)' : 'var(--text-muted)',
        transition: 'left 0.2s, background 0.2s',
      }} />
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { checkedInVenueId, checkOut, vibePoints, checkInCount, user, dbUser, refreshUser, signOut } = useApp()
  const { venues: allVenues } = useVenues()

  const [editing, setEditing]             = useState(false)
  const [tempBio, setTempBio]             = useState(user?.bio ?? '')
  const [tempInstagram, setTempInstagram] = useState(user?.instagram ?? '')
  const [tempMode, setTempMode]           = useState(user?.mode ?? 'vibing')
  const [saving, setSaving]               = useState(false)
  const [recentCheckins, setRecentCheckins] = useState([])
  const [visible, setVisible]             = useState(dbUser?.visible ?? true)

  useEffect(() => {
    if (!isConfigured || !dbUser?.id) return
    supabase
      .from('checkins')
      .select('id, created_at, venue_id, venues(id, name, type)')
      .eq('user_id', dbUser.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentCheckins(data ?? []))
  }, [dbUser?.id])

  const currentVenue = allVenues.find(v => String(v.id) === String(checkedInVenueId))

  const badges = [
    { icon: '🔥', label: 'Lit Regular', earned: vibePoints >= 100, sub: '100+ Vibe Points' },
    { icon: '🌃', label: 'Night Owl',   earned: checkInCount >= 2,  sub: 'Checked in twice+' },
    { icon: '📍', label: 'Explorer',    earned: checkInCount >= 10, sub: '10+ check-ins' },
    { icon: '🏆', label: 'Top Rater',   earned: vibePoints >= 500,  sub: '500+ Vibe Points' },
    { icon: '👑', label: 'Ambassador',  earned: false,              sub: 'Invite 10 friends' },
  ]
  const earnedCount = badges.filter(b => b.earned).length

  const modeData = MODE_OPTIONS.find(m => m.value === (user?.mode ?? 'vibing'))

  async function toggleVisibility() {
    const next = !visible
    setVisible(next)
    if (isConfigured && dbUser?.id) {
      await supabase.from('users').update({ visible: next }).eq('id', dbUser.id)
    }
  }

  async function saveProfile() {
    if (!isConfigured || !dbUser) {
      setEditing(false)
      return
    }
    setSaving(true)
    await supabase.from('users').update({
      bio: tempBio.trim() || null,
      instagram_handle: tempInstagram.replace(/^@/, '').trim() || null,
      mode: tempMode,
    }).eq('id', dbUser.id)
    await refreshUser()
    setSaving(false)
    setEditing(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/auth', { replace: true })
  }

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
            color: 'white', boxShadow: '0 0 30px rgba(255,107,43,0.4)',
          }}>
            {user?.avatar ?? 'ME'}
          </div>
          <div style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 16, height: 16, borderRadius: '50%',
            background: '#10F587', border: '2px solid var(--bg-primary)',
            boxShadow: '0 0 8px #10F587',
          }} />
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
          {user?.name ?? 'You'}
        </h1>

        {/* Mode badge */}
        {modeData && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: `${modeData.color}14`, border: `1px solid ${modeData.color}30`,
            borderRadius: 999, padding: '4px 12px', marginBottom: 8,
          }}>
            <span style={{ fontSize: 13 }}>{modeData.emoji}</span>
            <span style={{ fontSize: 12, color: modeData.color, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              {modeData.label}
            </span>
          </div>
        )}

        {/* Instagram handle */}
        {user?.instagram && !editing && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            @{user.instagram}
          </p>
        )}

        {/* Current check-in location */}
        {currentVenue && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(16,245,135,0.1)', border: '1px solid rgba(16,245,135,0.3)',
            borderRadius: 999, padding: '4px 12px', marginBottom: 12, cursor: 'pointer',
          }}
            onClick={() => navigate(`/venue/${currentVenue.id}`)}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: '#10F587',
              animation: 'pulse-dot 1.4s ease infinite',
            }} />
            <span style={{ fontSize: 12, color: '#10F587', fontWeight: 600 }}>At {currentVenue.name}</span>
            <button
              onClick={e => { e.stopPropagation(); checkOut() }}
              style={{ background: 'none', border: 'none', color: 'rgba(16,245,135,0.6)', fontSize: 11, cursor: 'pointer', marginLeft: 2 }}
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
              placeholder="Your bio..."
              style={{
                width: '100%', background: 'var(--bg-card)',
                border: '1px solid var(--border-active)', borderRadius: 12,
                padding: '10px 12px', color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', fontSize: 14, textAlign: 'center',
                resize: 'none', outline: 'none', minHeight: 60, boxSizing: 'border-box',
                marginBottom: 10,
              }}
            />

            {/* Instagram handle edit */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, color: 'var(--text-muted)',
              }}>@</span>
              <input
                type="text"
                value={tempInstagram}
                onChange={e => setTempInstagram(e.target.value.replace(/[@\s]/g, ''))}
                placeholder="Instagram handle"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg-card)', border: '1px solid var(--border-active)',
                  borderRadius: 12, padding: '12px 14px 12px 30px',
                  fontSize: 14, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)', outline: 'none',
                }}
              />
            </div>

            {/* Mode selector in edit */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'left' }}>Tonight's mode</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {MODE_OPTIONS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setTempMode(m.value)}
                    style={{
                      flex: 1, padding: '10px 6px', borderRadius: 12,
                      border: tempMode === m.value ? `1.5px solid ${m.color}` : '1px solid var(--border)',
                      background: tempMode === m.value ? `${m.color}14` : 'var(--bg-card)',
                      color: tempMode === m.value ? m.color : 'var(--text-secondary)',
                      fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {user?.bio && (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14 }}>{user.bio}</p>
            )}
            <button
              className="btn-secondary"
              style={{ maxWidth: 200, margin: '0 auto' }}
              onClick={() => {
                setTempBio(user?.bio ?? '')
                setTempInstagram(user?.instagram ?? '')
                setTempMode(user?.mode ?? 'vibing')
                setEditing(true)
              }}
            >
              Edit Profile
            </button>
          </>
        )}
      </div>

      <div style={{ padding: '20px 16px 100px' }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Vibe Points', value: vibePoints, icon: '⚡', color: '#FF6B2B' },
            { label: 'Age', value: user?.age ?? '—', icon: '🎂', color: '#8B5CF6' },
            { label: 'Check-ins', value: checkInCount, icon: '📍', color: '#00D4FF' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ flex: 1, padding: '14px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Vibe points explainer */}
        <div style={{
          padding: '12px 14px', borderRadius: 14, marginBottom: 24,
          background: 'rgba(255,107,43,0.06)', border: '1px solid rgba(255,107,43,0.15)',
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
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{earnedCount}/{badges.length} earned</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          {badges.map(b => (
            <div key={b.label} style={{ flexShrink: 0, textAlign: 'center', width: 70, opacity: b.earned ? 1 : 0.35 }}>
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
        {recentCheckins.length === 0 ? (
          <div style={{
            padding: '20px', textAlign: 'center', borderRadius: 14,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontSize: 13,
          }}>
            No check-ins yet — get out there! 🍻
          </div>
        ) : recentCheckins.map((c) => {
          const venue = c.venues
          return (
            <div
              key={c.id}
              onClick={() => navigate(`/venue/${c.venue_id}`)}
              style={{
                display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                alignItems: 'center', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>{VENUE_EMOJI[venue?.type] ?? '🍻'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  {venue?.name ?? 'Unknown venue'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Checked in · {timeAgo(c.created_at)}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FF6B2B', background: 'rgba(255,107,43,0.1)', padding: '3px 8px', borderRadius: 8 }}>
                +20 pts
              </span>
            </div>
          )
        })}

        {/* Settings */}
        <div className="section-header" style={{ marginTop: 24 }}>
          <span className="section-title">Settings</span>
        </div>

        {/* Visibility toggle — wired to Supabase */}
        <div
          onClick={toggleVisibility}
          style={{
            display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 14, marginBottom: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            alignItems: 'center', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 20 }}>👁</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              Visibility on Who's Here
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {visible ? 'Others can see you at venues' : 'Hidden — you won\'t appear in Who\'s Here'}
            </div>
          </div>
          <Toggle on={visible} />
        </div>

        {/* Static settings rows */}
        {[
          { icon: '🔔', label: 'Push Notifications', sub: 'Deals, vibes, and friend activity' },
          { icon: '📍', label: 'Location', sub: 'Required for check-ins and posts' },
          { icon: '🔒', label: 'Privacy', sub: 'Who can see your profile' },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 14, marginBottom: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{s.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.sub}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        ))}

        {/* Invite Friends */}
        <div className="section-header" style={{ marginTop: 24 }}>
          <span className="section-title">Invite Friends</span>
        </div>
        <InviteCard user={user} />

        {/* Log Out */}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', gap: 12, padding: '14px 16px',
            borderRadius: 14, marginBottom: 8, width: '100%',
            background: 'rgba(255,59,92,0.06)', border: '1px solid rgba(255,59,92,0.15)',
            alignItems: 'center', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 20 }}>🚪</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#FF3B5C' }}>Log Out</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sign out of your account</div>
          </div>
        </button>
      </div>
    </div>
  )
}
