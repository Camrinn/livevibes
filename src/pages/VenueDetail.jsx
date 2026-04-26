import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { venues } from '../data/mockData'
import VibeScore from '../components/VibeScore'
import { useApp } from '../context/AppContext'

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

export default function VenueDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { checkedInVenueId, checkIn, checkOut } = useApp()
  const venue = venues.find(v => v.id === parseInt(id))

  const [tab, setTab] = useState('Vibe')
  const [userRating, setUserRating] = useState(null)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [connecting, setConnecting] = useState({})
  const [postText, setPostText] = useState('')
  const [posts, setPosts] = useState(venue?.posts || [])
  const [likedPosts, setLikedPosts] = useState({})

  const isCheckedIn = checkedInVenueId === venue?.id

  if (!venue) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🤔</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>Venue not found</div>
      <button className="btn-primary" onClick={() => navigate('/')}>Back to Explore</button>
    </div>
  )

  const handleRate = (rating) => {
    if (ratingSubmitted) return
    setUserRating(rating)
    setRatingSubmitted(true)
  }

  const handleConnect = (personId) => {
    setConnecting(prev => ({ ...prev, [personId]: true }))
  }

  const handlePost = () => {
    if (!postText.trim()) return
    setPosts(prev => [{
      id: Date.now(),
      user: 'You',
      avatar: 'ME',
      time: 'Just now',
      content: postText,
      likes: 0,
      hasMedia: false,
    }, ...prev])
    setPostText('')
  }

  const handleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes: likedPosts[postId] ? p.likes - 1 : p.likes + 1 } : p
    ))
  }

  const handleCheckIn = () => {
    if (isCheckedIn) {
      checkOut()
    } else {
      if (checkedInVenueId) checkOut()
      checkIn(venue.id)
    }
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
        {/* Back button */}
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

        {/* Trending badge */}
        {venue.trending && (
          <div style={{
            position: 'absolute', top: 52, right: 16,
            background: 'rgba(255,59,92,0.15)',
            border: '1px solid rgba(255,59,92,0.3)',
            borderRadius: 999, padding: '4px 10px',
            fontSize: 10, color: '#FF3B5C',
            fontWeight: 700, letterSpacing: '0.5px',
            fontFamily: 'var(--font-display)',
          }}>
            TRENDING ↑
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 8 }}>
          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: `${venue.color}22`,
            border: `1.5px solid ${venue.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, flexShrink: 0,
          }}>
            {VENUE_EMOJI[venue.type] || '🍻'}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22, fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 4, lineHeight: 1.1,
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
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontSize: 11,
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <VibeScore score={venue.vibeScore} size="md" />
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {[
            { label: 'Here Now', value: venue.checkedIn, icon: '📍' },
            { label: 'Posts', value: posts.length, icon: '📸' },
            { label: 'Vibe', value: `${venue.vibeScore}/175`, icon: '⚡' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ flex: 1, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 14 }}>{s.icon}</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15, fontWeight: 700,
                color: 'var(--text-primary)',
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Check-in button */}
        <button
          className={isCheckedIn ? 'btn-secondary' : 'btn-primary'}
          style={{
            marginTop: 14,
            ...(isCheckedIn && {
              border: '1px solid rgba(16,245,135,0.4)',
              color: '#10F587',
              background: 'rgba(16,245,135,0.08)',
            })
          }}
          onClick={handleCheckIn}
        >
          {isCheckedIn ? '✓ Checked In Here' : '📍 Check In to This Venue'}
        </button>

        {isCheckedIn && (
          <p style={{
            fontSize: 12, color: 'var(--text-muted)',
            textAlign: 'center', marginTop: 8,
          }}>
            You're visible to others here · Tap to check out
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        background: 'rgba(10,10,18,0.97)',
        backdropFilter: 'blur(20px)',
        zIndex: 5,
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
              fontFamily: 'var(--font-display)',
              fontSize: 13, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
              letterSpacing: '0.3px',
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
            {/* Deal card */}
            {venue.deal?.active && (
              <div style={{
                padding: '14px 16px', borderRadius: 16,
                background: 'rgba(16,245,135,0.08)',
                border: '1px solid rgba(16,245,135,0.2)',
                marginBottom: 16,
                display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <span style={{ fontSize: 28 }}>🍹</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700, color: '#10F587', marginBottom: 2,
                  }}>
                    Active Deal
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{venue.deal.text}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ends at {venue.deal.endsAt}</div>
                </div>
                <div style={{
                  background: 'rgba(16,245,135,0.15)',
                  border: '1px solid rgba(16,245,135,0.3)',
                  borderRadius: 8, padding: '4px 8px',
                }}>
                  <span style={{ fontSize: 10, color: '#10F587', fontWeight: 700 }}>ACTIVE</span>
                </div>
              </div>
            )}

            {/* Rate this vibe */}
            <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15, fontWeight: 700,
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
                      fontFamily: 'var(--font-display)',
                      fontSize: 11, fontWeight: 700,
                      cursor: isCheckedIn ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                      opacity: !isCheckedIn ? 0.5 : 1,
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vibe score display */}
            <div className="glass-card" style={{
              padding: 24, textAlign: 'center', marginBottom: 16,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <VibeScore score={venue.vibeScore} size="lg" />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Based on {venue.checkedIn} people currently here
              </p>
              <div style={{
                display: 'flex', gap: 6, alignItems: 'center',
                background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 12px',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10F587', animation: 'pulse-dot 1.4s ease infinite' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Updating live</span>
              </div>
            </div>

            {/* Vibe scale guide */}
            <div className="glass-card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, fontFamily: 'var(--font-display)' }}>
                VIBE SCALE
              </p>
              {[
                { range: '151 – 175', label: 'Absolutely Lit 🔥', color: '#FF6B2B', fill: 100 },
                { range: '101 – 150', label: 'Vibing 😎', color: '#8B5CF6', fill: 72 },
                { range: '51 – 100', label: 'Mid / Chill 😐', color: '#00D4FF', fill: 44 },
                { range: '0 – 50', label: 'Dead 💀', color: '#44445A', fill: 20 },
              ].map(tier => (
                <div key={tier.range} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: tier.color, fontWeight: 600 }}>{tier.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tier.range}</span>
                  </div>
                  <div style={{
                    height: 4, borderRadius: 999,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${tier.fill}%`,
                      background: tier.color,
                      borderRadius: 999,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POSTS TAB */}
        {tab === 'Posts' && (
          <div>
            {/* Post input */}
            {isCheckedIn ? (
              <div className="glass-card" style={{ padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: 8 }}>
                  📍 You're here — share the vibe!
                </p>
                <textarea
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  placeholder="What's it like right now?"
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    resize: 'none',
                    outline: 'none',
                    minHeight: 72,
                    boxSizing: 'border-box',
                  }}
                  rows={3}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    style={{
                      flex: 0,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-muted)',
                      fontSize: 18,
                      cursor: 'pointer',
                    }}
                    title="Add photo"
                  >
                    📸
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, padding: '10px' }}
                    onClick={handlePost}
                  >
                    Post Update
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'rgba(0,212,255,0.06)',
                border: '1px solid rgba(0,212,255,0.15)',
                marginBottom: 16, textAlign: 'center',
              }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  📍 Check in to post and share the vibe
                </p>
                <button
                  onClick={handleCheckIn}
                  style={{
                    padding: '8px 18px', borderRadius: 10,
                    border: '1px solid var(--accent-cyan)',
                    background: 'rgba(0,212,255,0.1)',
                    color: 'var(--accent-cyan)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
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
                  {post.hasMedia && (
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
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{post.content}</p>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={() => handleLike(post.id)}
                          style={{
                            background: likedPosts[post.id] ? 'rgba(255,107,43,0.1)' : 'none',
                            border: 'none', cursor: 'pointer',
                            color: likedPosts[post.id] ? '#FF6B2B' : 'var(--text-muted)',
                            fontSize: 13,
                            display: 'flex', gap: 4, alignItems: 'center',
                            padding: '4px 8px', borderRadius: 8,
                            transition: 'all 0.2s',
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
            <div style={{
              padding: '10px 14px', borderRadius: 12,
              background: 'rgba(0,212,255,0.06)',
              border: '1px solid rgba(0,212,255,0.15)',
              marginBottom: 16,
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <span style={{ fontSize: 16 }}>👥</span>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>{venue.whoIsHere.length} people</strong> visible here right now
              </p>
            </div>

            {venue.whoIsHere.map(person => (
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
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700, fontSize: 15,
                    color: 'var(--text-primary)',
                  }}>
                    {person.name}, {person.age}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {person.bio}
                  </div>
                  {person.mutual > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--accent-cyan)', marginTop: 4 }}>
                      👥 {person.mutual} mutual friend{person.mutual > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleConnect(person.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 10,
                    border: connecting[person.id] ? '1px solid var(--accent-green)' : '1px solid var(--border-active)',
                    background: connecting[person.id] ? 'rgba(16,245,135,0.1)' : 'rgba(0,212,255,0.1)',
                    color: connecting[person.id] ? 'var(--accent-green)' : 'var(--accent-cyan)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 12, fontWeight: 700,
                    cursor: connecting[person.id] ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {connecting[person.id] ? '✓ Sent' : 'Connect'}
                </button>
              </div>
            ))}

            {/* Not checked in CTA */}
            {!isCheckedIn && (
              <div style={{
                padding: '16px', borderRadius: 16,
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.15)',
                textAlign: 'center', marginTop: 8,
              }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Check in to appear on this list and let others find you
                </p>
                <button
                  onClick={handleCheckIn}
                  style={{
                    padding: '8px 18px', borderRadius: 10,
                    border: '1px solid rgba(139,92,246,0.4)',
                    background: 'rgba(139,92,246,0.1)',
                    color: '#8B5CF6',
                    fontFamily: 'var(--font-display)',
                    fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Check In & Be Visible
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
