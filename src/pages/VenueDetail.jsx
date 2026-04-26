import React, { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import VibeScore from '../components/VibeScore'
import { useApp } from '../context/AppContext'
import { useVenueDetail } from '../hooks/useVenueDetail'
import { useCheckin } from '../hooks/useCheckin'
import { useGoingTonight } from '../hooks/useGoingTonight'
import { supabase, isConfigured } from '../lib/supabase'

const TABS = ['Vibe', 'Posts', "Who's Here"]

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

const MODE_COLOR = { friends: '#00D4FF', vibing: '#8B5CF6', connect: '#FF6B2B' }
const MODE_LABEL = { friends: '👥 Friends', vibing: '😎 Vibing', connect: '🔥 Connect' }

export default function VenueDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { checkedInVenueId, checkIn, checkOut, user } = useApp()
  const { venue, posts, setPosts, whoIsHere, vibeScore, loading } = useVenueDetail(id)
  const { checkIn: doCheckIn, checkOut: doCheckOut, voteVibe, submitPost } = useCheckin()
  const { isGoing, count: goingCount, toggle: toggleGoing } = useGoingTonight(id, user?.id)

  const [tab, setTab]                     = useState('Vibe')
  const [userRating, setUserRating]       = useState(null)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [postText, setPostText]           = useState('')
  const [photoFile, setPhotoFile]         = useState(null)
  const [photoPreview, setPhotoPreview]   = useState(null)
  const [likedPosts, setLikedPosts]       = useState({})
  const [geoError, setGeoError]           = useState('')
  const [connectModal, setConnectModal]   = useState(null) // person object
  const [connectSent, setConnectSent]     = useState({})
  const [connectLoading, setConnectLoading] = useState(false)
  const fileInputRef = useRef(null)

  const isCheckedIn = String(checkedInVenueId) === String(venue?.id)
  const displayScore = vibeScore || venue?.vibeScore || 0

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: 'pulse-dot 1.4s ease infinite' }}>⚡</div>
        <div>Loading venue...</div>
      </div>
    </div>
  )

  if (!venue) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🤔</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>Venue not found</div>
      <button className="btn-primary" onClick={() => navigate('/')}>Back to Explore</button>
    </div>
  )

  const handleRate = async (rating) => {
    if (ratingSubmitted) return
    setUserRating(rating)
    setRatingSubmitted(true)
    await voteVibe(venue.id, user?.id, rating)
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handlePost = async () => {
    if (!postText.trim() && !photoFile) return
    const text = postText
    const file = photoFile
    setPostText('')
    setPhotoFile(null)
    setPhotoPreview(null)

    const { error } = await submitPost(venue.id, user?.id, text, file)
    if (error) {
      setPosts(prev => [{
        id: Date.now(),
        user: user?.name ?? 'You',
        avatar: user?.avatar ?? 'ME',
        time: 'Just now',
        content: text,
        likes: 0,
        hasMedia: Boolean(file),
        mediaUrl: photoPreview,
      }, ...prev])
    }
  }

  const handleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes: likedPosts[postId] ? p.likes - 1 : p.likes + 1 } : p
    ))
  }

  const handleCheckIn = async () => {
    setGeoError('')
    if (isCheckedIn) {
      await doCheckOut(user?.id)
      checkOut()
    } else {
      const { success, error } = await doCheckIn(venue, user?.id, () => checkIn(venue.id))
      if (!success) setGeoError(error)
    }
  }

  const handleConnectTap = (person) => {
    if (connectSent[person.id]) return
    setConnectModal(person)
  }

  const handleSendConnect = async () => {
    if (!connectModal || connectLoading) return
    setConnectLoading(true)
    if (isConfigured && user?.id) {
      await supabase.from('connections').upsert({
        requester_id: user.id,
        target_id: connectModal.id,
        status: 'pending',
        requester_instagram: user.instagram ?? null,
      }, { onConflict: 'requester_id,target_id' })

      // Notify the target user
      await supabase.from('notifications').insert({
        user_id: connectModal.id,
        type: 'social',
        icon: '👋',
        message: `${user.name} wants to connect with you at ${venue.name}`,
        venue_id: venue.id,
      })
    }
    setConnectSent(prev => ({ ...prev, [connectModal.id]: true }))
    setConnectModal(null)
    setConnectLoading(false)
  }

  return (
    <div className="page">
      {/* Hero Header */}
      <div style={{
        position: 'relative',
        padding: '52px 20px 20px',
        background: `linear-gradient(180deg, ${venue.color}20 0%, transparent 100%)`,
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 52, left: 16,
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        {venue.trending && (
          <div style={{
            position: 'absolute', top: 52, right: 16,
            background: 'rgba(255,59,92,0.15)', border: '1px solid rgba(255,59,92,0.3)',
            borderRadius: 999, padding: '4px 10px',
            fontSize: 10, color: '#FF3B5C', fontWeight: 700, letterSpacing: '0.5px',
            fontFamily: 'var(--font-display)',
          }}>
            TRENDING ↑
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 8 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: `${venue.color}22`, border: `1.5px solid ${venue.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, flexShrink: 0,
          }}>
            {VENUE_EMOJI[venue.type] || '🍻'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
              color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.1,
            }}>
              {venue.name}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {venue.type} · {venue.distance}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              📍 {venue.address}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {venue.tags.map(t => (
                <span key={t} className="chip" style={{
                  background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', fontSize: 11,
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <VibeScore score={displayScore} size="md" />
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {[
            { label: 'Here Now', value: venue.checkedIn, icon: '📍' },
            { label: 'Going', value: goingCount, icon: '🗓' },
            { label: 'Vibe', value: `${displayScore}/175`, icon: '⚡' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ flex: 1, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 14 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            className={isCheckedIn ? 'btn-secondary' : 'btn-primary'}
            style={{
              flex: 1,
              ...(isCheckedIn && {
                border: '1px solid rgba(16,245,135,0.4)',
                color: '#10F587',
                background: 'rgba(16,245,135,0.08)',
              })
            }}
            onClick={handleCheckIn}
          >
            {isCheckedIn ? '✓ Checked In' : '📍 Check In'}
          </button>

          <button
            onClick={toggleGoing}
            style={{
              flex: 1, padding: '14px',
              borderRadius: 14,
              border: isGoing ? '1px solid rgba(139,92,246,0.5)' : '1px solid var(--border)',
              background: isGoing ? 'rgba(139,92,246,0.12)' : 'var(--bg-card)',
              color: isGoing ? '#8B5CF6' : 'var(--text-secondary)',
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {isGoing ? '✓ Going' : '🗓 Going Tonight'}
          </button>
        </div>

        {geoError && (
          <p style={{ fontSize: 12, color: '#FF3B5C', textAlign: 'center', marginTop: 8 }}>
            📍 {geoError}
          </p>
        )}
        {isCheckedIn && !geoError && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            You're visible to others here · Tap Check In to check out
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0,
        background: 'rgba(10,10,18,0.97)', backdropFilter: 'blur(20px)', zIndex: 5,
      }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '14px 0',
              background: 'none', border: 'none',
              borderBottom: tab === t ? `2px solid ${venue.color}` : '2px solid transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '16px', paddingBottom: 100 }}>

        {/* VIBE TAB */}
        {tab === 'Vibe' && (
          <div>
            {venue.deal?.active && (
              <div style={{
                padding: '14px 16px', borderRadius: 16,
                background: 'rgba(16,245,135,0.08)', border: '1px solid rgba(16,245,135,0.2)',
                marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <span style={{ fontSize: 28 }}>🍹</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#10F587', marginBottom: 2 }}>
                    Active Deal
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{venue.deal.text}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ends at {venue.deal.endsAt}</div>
                </div>
                <div style={{
                  background: 'rgba(16,245,135,0.15)', border: '1px solid rgba(16,245,135,0.3)',
                  borderRadius: 8, padding: '4px 8px',
                }}>
                  <span style={{ fontSize: 10, color: '#10F587', fontWeight: 700 }}>ACTIVE</span>
                </div>
              </div>
            )}

            <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                marginBottom: 4, color: 'var(--text-primary)',
              }}>
                What's the vibe right now?
              </h3>
              {!isCheckedIn && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Check in to cast your vote
                </p>
              )}
              {isCheckedIn && !ratingSubmitted && (
                <p style={{ fontSize: 12, color: 'var(--accent-cyan)', marginBottom: 12 }}>
                  📍 You're here — your vote counts double
                </p>
              )}
              {ratingSubmitted && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  ✓ You voted · Thanks for keeping it real 🙌
                </p>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: '🔥 Lit', value: 'lit', color: '#FF6B2B' },
                  { label: '😎 Vibing', value: 'vibing', color: '#8B5CF6' },
                  { label: '😐 Mid', value: 'mid', color: '#00D4FF' },
                  { label: '💀 Dead', value: 'dead', color: '#44445A' },
                ].map(r => (
                  <button
                    key={r.value}
                    onClick={() => isCheckedIn && handleRate(r.value)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 12,
                      border: userRating === r.value ? `1.5px solid ${r.color}` : '1px solid var(--border)',
                      background: userRating === r.value ? `${r.color}22` : 'var(--bg-card)',
                      color: userRating === r.value ? r.color : isCheckedIn ? 'var(--text-secondary)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                      cursor: isCheckedIn ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s', opacity: !isCheckedIn ? 0.5 : 1,
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{
              padding: 24, textAlign: 'center', marginBottom: 16,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <VibeScore score={displayScore} size="lg" />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Based on {venue.checkedIn ?? whoIsHere.length} people currently here
              </p>
              <div style={{
                display: 'flex', gap: 6, alignItems: 'center',
                background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 12px',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10F587', animation: 'pulse-dot 1.4s ease infinite' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Updating live</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, fontFamily: 'var(--font-display)' }}>
                VIBE SCALE
              </p>
              {[
                { range: '151 – 175', label: 'Absolutely Lit 🔥', color: '#FF6B2B', fill: 100 },
                { range: '101 – 150', label: 'Vibing 😎', color: '#8B5CF6', fill: 72 },
                { range: '51 – 100', label: 'Mid / Chill 😐', color: '#00D4FF', fill: 44 },
                { range: '0 – 50',   label: 'Dead 💀', color: '#44445A', fill: 20 },
              ].map(tier => (
                <div key={tier.range} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: tier.color, fontWeight: 600 }}>{tier.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tier.range}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${tier.fill}%`, background: tier.color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POSTS TAB */}
        {tab === 'Posts' && (
          <div>
            {isCheckedIn ? (
              <div className="glass-card" style={{ padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: 8 }}>
                  📍 You're here — share the vibe!
                </p>

                {/* Photo preview */}
                {photoPreview && (
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <img
                      src={photoPreview}
                      alt="preview"
                      style={{ width: '100%', borderRadius: 10, maxHeight: 200, objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)', border: 'none',
                        color: 'white', fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <textarea
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  placeholder="What's it like right now?"
                  style={{
                    width: '100%', background: 'var(--bg-primary)',
                    border: '1px solid var(--border)', borderRadius: 10,
                    padding: '10px 12px', color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)', fontSize: 14,
                    resize: 'none', outline: 'none', minHeight: 72,
                    boxSizing: 'border-box',
                  }}
                  rows={3}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handlePhotoSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      flex: 0, padding: '10px 14px', borderRadius: 10,
                      border: photoFile ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--border)',
                      background: photoFile ? 'rgba(0,212,255,0.08)' : 'var(--bg-card)',
                      color: photoFile ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      fontSize: 18, cursor: 'pointer',
                    }}
                    title="Add photo"
                  >
                    📸
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, padding: '10px' }}
                    onClick={handlePost}
                    disabled={!postText.trim() && !photoFile}
                  >
                    Post Update
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                marginBottom: 16, textAlign: 'center',
              }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  📍 Check in to post and share the vibe
                </p>
                <button
                  onClick={handleCheckIn}
                  style={{
                    padding: '8px 18px', borderRadius: 10,
                    border: '1px solid var(--accent-cyan)', background: 'rgba(0,212,255,0.1)',
                    color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Check In Now
                </button>
              </div>
            )}

            {posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>No posts yet</div>
                <div style={{ fontSize: 13 }}>Be the first to share the vibe!</div>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="glass-card" style={{ padding: 14, marginBottom: 10 }}>
                  {post.hasMedia && post.mediaUrl && (
                    <img
                      src={post.mediaUrl}
                      alt="post"
                      style={{ width: '100%', borderRadius: 10, marginBottom: 10, maxHeight: 220, objectFit: 'cover' }}
                    />
                  )}
                  {post.hasMedia && !post.mediaUrl && (
                    <div style={{
                      height: 120, borderRadius: 10, marginBottom: 10,
                      background: `linear-gradient(135deg, ${venue.color}22, rgba(139,92,246,0.2))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${venue.color}22`,
                    }}>
                      <span style={{ fontSize: 32 }}>📸</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div className="avatar" style={{
                      width: 36, height: 36, fontSize: 12,
                      background: 'linear-gradient(135deg, rgba(255,107,43,0.25), rgba(139,92,246,0.25))',
                    }}>
                      {post.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{post.user}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{post.time}</span>
                      </div>
                      {post.content && (
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{post.content}</p>
                      )}
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={() => handleLike(post.id)}
                          style={{
                            background: likedPosts[post.id] ? 'rgba(255,107,43,0.1)' : 'none',
                            border: 'none', cursor: 'pointer',
                            color: likedPosts[post.id] ? '#FF6B2B' : 'var(--text-muted)',
                            fontSize: 13, display: 'flex', gap: 4, alignItems: 'center',
                            padding: '4px 8px', borderRadius: 8, transition: 'all 0.2s',
                          }}
                        >
                          🔥 {post.likes}
                        </button>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                          📍 Location verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* WHO'S HERE TAB */}
        {tab === "Who's Here" && (
          <div>
            {/* Privacy gate — blurred list when not checked in */}
            {!isCheckedIn ? (
              <div style={{ position: 'relative' }}>
                {/* Blurred preview cards */}
                <div style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
                  {(whoIsHere.slice(0, 4).length > 0 ? whoIsHere.slice(0, 4) : [
                    { id: 'p1', avatar: 'AJ', name: 'Alex J.', age: 26, bio: 'Just here for a good time', mode: 'vibing', mutual: 1 },
                    { id: 'p2', avatar: 'SM', name: 'Sarah M.', age: 24, bio: 'Cocktails and dancing', mode: 'connect', mutual: 0 },
                    { id: 'p3', avatar: 'KL', name: 'Kyle L.', age: 28, bio: 'Good vibes only', mode: 'friends', mutual: 2 },
                  ]).map(person => (
                    <div key={person.id} className="glass-card" style={{
                      padding: '14px', marginBottom: 10,
                      display: 'flex', gap: 12, alignItems: 'center',
                    }}>
                      <div className="avatar" style={{
                        width: 48, height: 48, fontSize: 14,
                        background: 'linear-gradient(135deg, rgba(255,107,43,0.25), rgba(139,92,246,0.25))',
                        border: '1.5px solid var(--border)',
                      }}>
                        {person.avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                          {person.name}{person.age ? `, ${person.age}` : ''}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{person.bio}</div>
                      </div>
                      <div style={{
                        padding: '6px 12px', borderRadius: 10,
                        border: '1px solid var(--border)', background: 'var(--bg-card)',
                        fontSize: 12, color: 'var(--text-muted)', fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                      }}>
                        Connect
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lock overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,18,0.85) 40%)',
                  borderRadius: 16,
                  padding: '0 24px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800,
                    color: 'var(--text-primary)', marginBottom: 8,
                  }}>
                    Check in to see who's here
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    GPS-verify your location to unlock the full Who's Here list and let others see you.
                  </p>
                  <button
                    onClick={handleCheckIn}
                    className="btn-primary"
                    style={{ maxWidth: 240 }}
                  >
                    📍 Check In Now
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                  marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <span style={{ fontSize: 16 }}>👥</span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{whoIsHere.length} people</strong> visible here right now
                  </p>
                </div>

                {whoIsHere.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>👻</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>
                      You're the first one here
                    </div>
                    <div style={{ fontSize: 13 }}>Others will show up as they check in</div>
                  </div>
                ) : (
                  whoIsHere.map(person => {
                    const modeColor = MODE_COLOR[person.mode] ?? '#8B5CF6'
                    const modeLabel = MODE_LABEL[person.mode] ?? '😎 Vibing'
                    return (
                      <div key={person.id} className="glass-card" style={{
                        padding: '14px', marginBottom: 10,
                        display: 'flex', gap: 12, alignItems: 'center',
                      }}>
                        <div className="avatar" style={{
                          width: 48, height: 48, fontSize: 14,
                          background: 'linear-gradient(135deg, rgba(255,107,43,0.25), rgba(139,92,246,0.25))',
                          border: '1.5px solid var(--border)',
                        }}>
                          {person.avatar}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                            color: 'var(--text-primary)', marginBottom: 2,
                          }}>
                            {person.name}{person.age ? `, ${person.age}` : ''}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{person.bio}</div>
                          <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)',
                              color: modeColor,
                              background: `${modeColor}18`,
                              border: `1px solid ${modeColor}30`,
                              borderRadius: 6, padding: '2px 7px',
                            }}>
                              {modeLabel}
                            </span>
                            {person.mutual > 0 && (
                              <span style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>
                                👥 {person.mutual} mutual
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleConnectTap(person)}
                          style={{
                            padding: '8px 14px', borderRadius: 10,
                            border: connectSent[person.id] ? '1px solid var(--accent-green)' : '1px solid var(--border-active)',
                            background: connectSent[person.id] ? 'rgba(16,245,135,0.1)' : 'rgba(0,212,255,0.1)',
                            color: connectSent[person.id] ? 'var(--accent-green)' : 'var(--accent-cyan)',
                            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                            cursor: connectSent[person.id] ? 'default' : 'pointer',
                            transition: 'all 0.2s', flexShrink: 0,
                          }}
                        >
                          {connectSent[person.id] ? '✓ Sent' : 'Connect'}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {connectModal && (
        <div
          onClick={() => setConnectModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end', padding: '0 0 40px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480, margin: '0 auto',
              background: 'var(--bg-card)',
              borderRadius: '24px 24px 0 0',
              border: '1px solid var(--border)',
              padding: '24px 24px 32px',
            }}
          >
            {/* Drag handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 999,
              background: 'var(--border)', margin: '0 auto 20px',
            }} />

            <h3 style={{
              fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
              color: 'var(--text-primary)', marginBottom: 6, textAlign: 'center',
            }}>
              Connect with {connectModal.name.split(' ')[0]}
            </h3>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 20 }}>
              Send a connection request. If they accept, you'll each see the other's Instagram handle.
            </p>

            {/* Your handle preview */}
            <div style={{
              padding: '14px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                They'll see your Instagram handle:
              </p>
              <p style={{
                fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)',
                color: user?.instagram ? 'var(--accent-cyan)' : 'var(--text-muted)',
              }}>
                {user?.instagram ? `@${user.instagram}` : 'Not set — add it in your profile'}
              </p>
            </div>

            <button
              className="btn-primary"
              onClick={handleSendConnect}
              disabled={connectLoading}
              style={{ marginBottom: 12 }}
            >
              {connectLoading ? 'Sending...' : `Send Connection Request`}
            </button>

            <button
              onClick={() => setConnectModal(null)}
              style={{
                width: '100%', padding: '12px', background: 'none',
                border: 'none', color: 'var(--text-muted)',
                fontSize: 14, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
