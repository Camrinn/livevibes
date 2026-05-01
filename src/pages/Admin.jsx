import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const ADMIN_TABS = ['Venues', 'Posts', 'Deals', 'Stats']

const VENUE_EMOJI = {
  'Sports Bar': '🏈', 'Live Music Bar': '🎸', 'Irish Pub': '🍺',
  'Nightclub': '🎧', 'Rooftop Bar': '🌃', 'Latin Club': '💃',
  'Music Venue': '🎵', 'Garden Bar': '🌿', 'Waterfront Bar': '⚓',
}

function timeAgo(ts) {
  if (!ts) return ''
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function Admin() {
  const navigate       = useNavigate()
  const { user }       = useApp()
  const [tab, setTab]  = useState('Venues')

  // ── Venues tab ──────────────────────────────────────────────
  const [pending, setPending]         = useState([])
  const [activeVenues, setActiveVenues] = useState([])
  const [venuesLoaded, setVenuesLoaded] = useState(false)
  const [acting, setActing]           = useState({})
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting]     = useState(false)

  // ── Posts tab ────────────────────────────────────────────────
  const [flaggedPosts, setFlaggedPosts] = useState([])
  const [postsLoaded, setPostsLoaded]  = useState(false)
  const [moderating, setModerating]   = useState({})

  // ── Deals tab ────────────────────────────────────────────────
  const [dealVenues, setDealVenues]       = useState([])
  const [selectedDealVenueId, setSelectedDealVenueId] = useState(null)
  const [venueDeals, setVenueDeals]       = useState([])
  const [dealsLoaded, setDealsLoaded]     = useState(false)
  const [addDealMode, setAddDealMode]     = useState(false)
  const [newDealText, setNewDealText]     = useState('')
  const [newDealEndsAt, setNewDealEndsAt] = useState('')
  const [savingDeal, setSavingDeal]       = useState(false)
  const [dealVenueSearch, setDealVenueSearch] = useState('')

  // ── Stats tab ────────────────────────────────────────────────
  const [adminStats, setAdminStats]   = useState(null)
  const [statsLoaded, setStatsLoaded] = useState(false)

  // ─────────────────────────────────────────────────────────────
  // Load functions — lazy per tab
  // ─────────────────────────────────────────────────────────────

  const loadVenues = useCallback(async () => {
    if (!isConfigured) { setVenuesLoaded(true); return }
    const [pendingRes, activeRes] = await Promise.all([
      supabase
        .from('venues')
        .select('id, name, type, address, submitted_at, submitted_by, users!submitted_by(name)')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false }),
      supabase
        .from('venues')
        .select('id, name, type, pinned, status')
        .eq('status', 'active')
        .order('name'),
    ])
    setPending(pendingRes.data ?? [])
    setActiveVenues(activeRes.data ?? [])
    setVenuesLoaded(true)
  }, [])

  const loadFlaggedPosts = useCallback(async () => {
    if (!isConfigured) { setPostsLoaded(true); return }
    const { data } = await supabase
      .from('posts')
      .select('id, content, media_url, media_type, created_at, flag_count, user_id, venue_id, poster:users(name), venue:venues(name)')
      .gt('flag_count', 0)
      .is('deleted_at', null)
      .order('flag_count', { ascending: false })
      .limit(50)
    setFlaggedPosts(data ?? [])
    setPostsLoaded(true)
  }, [])

  const loadDealVenues = useCallback(async () => {
    if (!isConfigured) { setDealsLoaded(true); return }
    const { data } = await supabase
      .from('venues')
      .select('id, name, type')
      .eq('status', 'active')
      .order('name')
    setDealVenues(data ?? [])
    setDealsLoaded(true)
  }, [])

  const loadDealsForVenue = useCallback(async (venueId) => {
    if (!venueId || !isConfigured) return
    const { data } = await supabase
      .from('deals')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false })
    setVenueDeals(data ?? [])
  }, [])

  const loadStats = useCallback(async () => {
    if (!isConfigured) { setStatsLoaded(true); return }
    const { data } = await supabase.rpc('get_admin_stats')
    setAdminStats(data)
    setStatsLoaded(true)
  }, [])

  // Trigger loads when tab is first opened
  useEffect(() => {
    if (tab === 'Venues' && !venuesLoaded) loadVenues()
    if (tab === 'Posts'  && !postsLoaded)  loadFlaggedPosts()
    if (tab === 'Deals'  && !dealsLoaded)  loadDealVenues()
    if (tab === 'Stats'  && !statsLoaded)  loadStats()
  }, [tab, venuesLoaded, postsLoaded, dealsLoaded, statsLoaded, loadVenues, loadFlaggedPosts, loadDealVenues, loadStats])

  // ─────────────────────────────────────────────────────────────
  // Gate: non-admins see a lock screen
  // ─────────────────────────────────────────────────────────────
  if (!user?.isAdmin) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 40, textAlign: 'center', background: 'var(--bg-primary)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          Admin only
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
          You don't have access to this page.
        </p>
        <button className="btn-primary" onClick={() => navigate('/')}>Go home</button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Venues tab actions
  // ─────────────────────────────────────────────────────────────

  async function approveVenue(venueId) {
    setActing(a => ({ ...a, [venueId]: 'approving' }))
    await supabase.from('venues').update({ status: 'active' }).eq('id', venueId)
    // Notify submitter
    const venue = pending.find(v => v.id === venueId)
    if (venue?.submitted_by) {
      await supabase.from('notifications').insert({
        user_id: venue.submitted_by, type: 'social', icon: '🎉',
        message: `Your venue "${venue.name}" is now live on Live Vibes!`,
        venue_id: venueId,
      })
    }
    setPending(prev => prev.filter(v => v.id !== venueId))
    setActing(a => { const n = { ...a }; delete n[venueId]; return n })
  }

  async function confirmReject() {
    if (!rejectModal) return
    setRejecting(true)
    await supabase.from('venues').update({
      status: 'rejected',
      rejection_reason: rejectReason.trim() || null,
    }).eq('id', rejectModal.id)
    if (rejectModal.submitted_by) {
      await supabase.from('notifications').insert({
        user_id: rejectModal.submitted_by, type: 'social', icon: '❌',
        message: `Your venue "${rejectModal.name}" wasn't approved.${rejectReason.trim() ? ` Reason: ${rejectReason.trim()}` : ''}`,
        venue_id: rejectModal.id,
      })
    }
    setPending(prev => prev.filter(v => v.id !== rejectModal.id))
    setRejectModal(null)
    setRejectReason('')
    setRejecting(false)
  }

  async function togglePin(venue) {
    const next = !venue.pinned
    await supabase.from('venues').update({ pinned: next }).eq('id', venue.id)
    setActiveVenues(prev => prev.map(v => v.id === venue.id ? { ...v, pinned: next } : v))
  }

  async function archiveVenue(venueId) {
    await supabase.from('venues').update({ status: 'archived' }).eq('id', venueId)
    setActiveVenues(prev => prev.filter(v => v.id !== venueId))
  }

  // ─────────────────────────────────────────────────────────────
  // Posts tab actions
  // ─────────────────────────────────────────────────────────────

  async function removePost(postId) {
    setModerating(m => ({ ...m, [postId]: 'removing' }))
    await supabase.rpc('admin_remove_post', { p_post_id: postId })
    setFlaggedPosts(prev => prev.filter(p => p.id !== postId))
    setModerating(m => { const n = { ...m }; delete n[postId]; return n })
  }

  async function dismissFlags(postId) {
    setModerating(m => ({ ...m, [postId]: 'dismissing' }))
    await supabase.rpc('admin_resolve_flags', { p_post_id: postId })
    setFlaggedPosts(prev => prev.filter(p => p.id !== postId))
    setModerating(m => { const n = { ...m }; delete n[postId]; return n })
  }

  // ─────────────────────────────────────────────────────────────
  // Deals tab actions
  // ─────────────────────────────────────────────────────────────

  async function selectDealVenue(venueId) {
    setSelectedDealVenueId(venueId)
    setAddDealMode(false)
    await loadDealsForVenue(venueId)
  }

  async function addDeal() {
    if (!newDealText.trim() || !newDealEndsAt || !selectedDealVenueId) return
    setSavingDeal(true)
    const { data } = await supabase.from('deals').insert({
      venue_id: selectedDealVenueId,
      text: newDealText.trim(),
      ends_at: new Date(newDealEndsAt).toISOString(),
      active: true,
    }).select().single()
    if (data) setVenueDeals(prev => [data, ...prev])
    setNewDealText('')
    setNewDealEndsAt('')
    setAddDealMode(false)
    setSavingDeal(false)
  }

  async function toggleDeal(deal) {
    const next = !deal.active
    await supabase.from('deals').update({ active: next }).eq('id', deal.id)
    setVenueDeals(prev => prev.map(d => d.id === deal.id ? { ...d, active: next } : d))
  }

  async function deleteDeal(dealId) {
    await supabase.from('deals').delete().eq('id', dealId)
    setVenueDeals(prev => prev.filter(d => d.id !== dealId))
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  const pendingFlagsCount = flaggedPosts.length

  return (
    <div className="page">
      {/* Header */}
      <div style={{ padding: '52px 20px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button
            onClick={() => navigate('/profile')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 14 }}
          >
            ←
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>
            Admin Panel
          </h1>
          <span style={{
            background: 'rgba(255,59,92,0.15)', border: '1px solid rgba(255,59,92,0.3)',
            borderRadius: 6, padding: '2px 8px', fontSize: 10, color: '#FF3B5C',
            fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '1px',
          }}>
            ADMIN
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex' }}>
          {ADMIN_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '12px 0', background: 'none', border: 'none',
                borderBottom: tab === t ? '2px solid #FF6B2B' : '2px solid transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', position: 'relative',
              }}
            >
              {t}
              {t === 'Posts' && pendingFlagsCount > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  background: '#FF3B5C', borderRadius: '50%',
                  width: 16, height: 16, fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                }}>
                  {pendingFlagsCount > 9 ? '9+' : pendingFlagsCount}
                </span>
              )}
              {t === 'Venues' && pending.length > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  background: '#FF6B2B', borderRadius: '50%',
                  width: 16, height: 16, fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                }}>
                  {pending.length > 9 ? '9+' : pending.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px', overflowY: 'auto' }}>

        {/* ── VENUES TAB ─────────────────────────────────────── */}
        {tab === 'Venues' && (
          <div>
            {/* Pending submissions */}
            <div className="section-header">
              <span className="section-title">Pending Review</span>
              <span style={{ fontSize: 12, color: pending.length > 0 ? '#FF6B2B' : 'var(--text-muted)' }}>
                {!venuesLoaded ? '...' : `${pending.length} waiting`}
              </span>
            </div>

            {!venuesLoaded && <LoadingRow />}

            {venuesLoaded && pending.length === 0 && (
              <EmptyState icon="✅" title="All caught up" sub="No pending submissions" />
            )}

            {pending.map(venue => {
              const busy = acting[venue.id]
              return (
                <div key={venue.id} style={{
                  padding: 16, borderRadius: 16, marginBottom: 12,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: 'rgba(255,107,43,0.12)', border: '1px solid rgba(255,107,43,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {VENUE_EMOJI[venue.type] ?? '🍻'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {venue.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{venue.type}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {venue.address}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    By {venue.users?.name ?? 'unknown'} · {timeAgo(venue.submitted_at)}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => approveVenue(venue.id)}
                      disabled={!!busy}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 12,
                        border: '1px solid rgba(16,245,135,0.4)',
                        background: 'rgba(16,245,135,0.1)',
                        color: '#10F587', fontWeight: 700, fontSize: 13,
                        cursor: busy ? 'not-allowed' : 'pointer',
                        opacity: busy && busy !== 'approving' ? 0.4 : 1,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {busy === 'approving' ? 'Approving...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => { setRejectModal(venue); setRejectReason('') }}
                      disabled={!!busy}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 12,
                        border: '1px solid rgba(255,59,92,0.3)',
                        background: 'rgba(255,59,92,0.08)',
                        color: '#FF3B5C', fontWeight: 700, fontSize: 13,
                        cursor: busy ? 'not-allowed' : 'pointer',
                        opacity: busy && busy !== 'rejecting' ? 0.4 : 1,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Active venues */}
            {venuesLoaded && activeVenues.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: 24 }}>
                  <span className="section-title">Active Venues</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeVenues.length} live</span>
                </div>
                {activeVenues.map(venue => (
                  <div key={venue.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 14, marginBottom: 8,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 18 }}>{VENUE_EMOJI[venue.type] ?? '🍻'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {venue.name}
                        {venue.pinned && <span style={{ fontSize: 9, color: '#FF6B2B', fontWeight: 700, background: 'rgba(255,107,43,0.1)', padding: '1px 6px', borderRadius: 4 }}>PINNED</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => togglePin(venue)}
                      style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        border: venue.pinned ? '1px solid rgba(255,107,43,0.4)' : '1px solid var(--border)',
                        background: venue.pinned ? 'rgba(255,107,43,0.1)' : 'var(--bg-primary)',
                        color: venue.pinned ? '#FF6B2B' : 'var(--text-muted)', cursor: 'pointer',
                      }}
                    >
                      {venue.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={() => archiveVenue(venue.id)}
                      style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        border: '1px solid rgba(255,59,92,0.2)',
                        background: 'transparent', color: '#FF3B5C', cursor: 'pointer',
                      }}
                    >
                      Archive
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── POSTS TAB ──────────────────────────────────────── */}
        {tab === 'Posts' && (
          <div>
            <div className="section-header">
              <span className="section-title">Flagged Content</span>
              <span style={{ fontSize: 12, color: flaggedPosts.length > 0 ? '#FF3B5C' : 'var(--text-muted)' }}>
                {!postsLoaded ? '...' : `${flaggedPosts.length} flagged`}
              </span>
            </div>

            {!postsLoaded && <LoadingRow />}

            {postsLoaded && flaggedPosts.length === 0 && (
              <EmptyState icon="✅" title="No flagged posts" sub="All content looks good" />
            )}

            {flaggedPosts.map(post => {
              const busy = moderating[post.id]
              return (
                <div key={post.id} style={{
                  borderRadius: 16, marginBottom: 12, overflow: 'hidden',
                  background: 'var(--bg-card)', border: '1px solid rgba(255,59,92,0.2)',
                }}>
                  {/* Media thumbnail */}
                  {post.media_url && (
                    post.media_type === 'video' ? (
                      <video src={post.media_url} style={{ width: '100%', maxHeight: 140, objectFit: 'cover' }} />
                    ) : (
                      <img src={post.media_url} alt="flagged" style={{ width: '100%', maxHeight: 140, objectFit: 'cover' }} />
                    )
                  )}
                  <div style={{ padding: '12px 14px' }}>
                    {/* Meta */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                          {post.poster?.name ?? 'Unknown'}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                          at {post.venue?.name ?? 'Unknown'}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#FF3B5C',
                        background: 'rgba(255,59,92,0.1)', padding: '2px 8px', borderRadius: 6,
                      }}>
                        🚩 {post.flag_count} flag{post.flag_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {post.content && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>
                        {post.content}
                      </p>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                      {timeAgo(post.created_at)}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => removePost(post.id)}
                        disabled={!!busy}
                        style={{
                          flex: 1, padding: '9px', borderRadius: 10,
                          border: '1px solid rgba(255,59,92,0.3)',
                          background: 'rgba(255,59,92,0.08)',
                          color: '#FF3B5C', fontWeight: 700, fontSize: 12,
                          cursor: busy ? 'not-allowed' : 'pointer',
                          opacity: busy && busy !== 'removing' ? 0.4 : 1,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {busy === 'removing' ? 'Removing...' : '🗑 Remove Post'}
                      </button>
                      <button
                        onClick={() => dismissFlags(post.id)}
                        disabled={!!busy}
                        style={{
                          flex: 1, padding: '9px', borderRadius: 10,
                          border: '1px solid rgba(16,245,135,0.3)',
                          background: 'rgba(16,245,135,0.06)',
                          color: '#10F587', fontWeight: 700, fontSize: 12,
                          cursor: busy ? 'not-allowed' : 'pointer',
                          opacity: busy && busy !== 'dismissing' ? 0.4 : 1,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {busy === 'dismissing' ? '...' : '✓ Keep Post'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── DEALS TAB ──────────────────────────────────────── */}
        {tab === 'Deals' && (
          <div>
            {!dealsLoaded && <LoadingRow />}

            {dealsLoaded && !selectedDealVenueId && (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                  Select a venue to manage its deals.
                </p>
                <input
                  className="input-field"
                  placeholder="Search venues..."
                  value={dealVenueSearch}
                  onChange={e => setDealVenueSearch(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                {dealVenues
                  .filter(v => v.name.toLowerCase().includes(dealVenueSearch.toLowerCase()))
                  .map(venue => (
                    <div
                      key={venue.id}
                      onClick={() => selectDealVenue(venue.id)}
                      style={{
                        display: 'flex', gap: 10, padding: '13px 14px', borderRadius: 14, marginBottom: 8,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        alignItems: 'center', cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{VENUE_EMOJI[venue.type] ?? '🍻'}</span>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        {venue.name}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  ))
                }
              </>
            )}

            {dealsLoaded && selectedDealVenueId && (
              <>
                {/* Back + header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={() => { setSelectedDealVenueId(null); setVenueDeals([]); setAddDealMode(false) }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 14 }}
                  >
                    ← Back
                  </button>
                  <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                    {dealVenues.find(v => v.id === selectedDealVenueId)?.name}
                  </span>
                  <button
                    onClick={() => setAddDealMode(m => !m)}
                    style={{
                      padding: '6px 12px', borderRadius: 10,
                      border: '1px solid rgba(16,245,135,0.3)', background: 'rgba(16,245,135,0.08)',
                      color: '#10F587', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {addDealMode ? 'Cancel' : '+ Add Deal'}
                  </button>
                </div>

                {/* Add deal form */}
                {addDealMode && (
                  <div style={{
                    padding: 16, borderRadius: 16, marginBottom: 16,
                    background: 'rgba(16,245,135,0.06)', border: '1px solid rgba(16,245,135,0.2)',
                  }}>
                    <input
                      className="input-field"
                      placeholder="Deal description (e.g. 2-for-1 cocktails)"
                      value={newDealText}
                      onChange={e => setNewDealText(e.target.value)}
                      style={{ marginBottom: 10 }}
                    />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Ends at</p>
                    <input
                      type="datetime-local"
                      value={newDealEndsAt}
                      onChange={e => setNewDealEndsAt(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'var(--bg-primary)', border: '1px solid var(--border)',
                        borderRadius: 12, padding: '10px 14px', color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', marginBottom: 12,
                      }}
                    />
                    <button
                      className="btn-primary"
                      onClick={addDeal}
                      disabled={savingDeal || !newDealText.trim() || !newDealEndsAt}
                    >
                      {savingDeal ? 'Saving...' : 'Add Deal'}
                    </button>
                  </div>
                )}

                {venueDeals.length === 0 ? (
                  <EmptyState icon="🍹" title="No deals yet" sub="Add one using the button above" />
                ) : (
                  venueDeals.map(deal => (
                    <div key={deal.id} style={{
                      padding: '14px 16px', borderRadius: 14, marginBottom: 10,
                      background: 'var(--bg-card)', border: `1px solid ${deal.active ? 'rgba(16,245,135,0.25)' : 'var(--border)'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ flex: 1, marginRight: 10 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {deal.text}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Ends {new Date(deal.ends_at).toLocaleDateString()} at {new Date(deal.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                          background: deal.active ? 'rgba(16,245,135,0.15)' : 'var(--bg-primary)',
                          color: deal.active ? '#10F587' : 'var(--text-muted)',
                          border: `1px solid ${deal.active ? 'rgba(16,245,135,0.3)' : 'var(--border)'}`,
                        }}>
                          {deal.active ? 'ACTIVE' : 'OFF'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => toggleDeal(deal)}
                          style={{
                            flex: 1, padding: '8px', borderRadius: 10,
                            border: deal.active ? '1px solid rgba(255,107,43,0.3)' : '1px solid rgba(16,245,135,0.3)',
                            background: deal.active ? 'rgba(255,107,43,0.06)' : 'rgba(16,245,135,0.06)',
                            color: deal.active ? '#FF6B2B' : '#10F587',
                            fontWeight: 700, fontSize: 12, cursor: 'pointer',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {deal.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteDeal(deal.id)}
                          style={{
                            padding: '8px 14px', borderRadius: 10,
                            border: '1px solid rgba(255,59,92,0.2)',
                            background: 'transparent', color: '#FF3B5C',
                            fontWeight: 700, fontSize: 12, cursor: 'pointer',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {/* ── STATS TAB ──────────────────────────────────────── */}
        {tab === 'Stats' && (
          <div>
            {!statsLoaded && <LoadingRow />}

            {statsLoaded && !adminStats && (
              <EmptyState icon="📊" title="Stats unavailable" sub="Could not load admin stats" />
            )}

            {statsLoaded && adminStats && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Live Venues',    value: adminStats.active_venues,       icon: '🏠', color: '#10F587' },
                    { label: 'Pending Venues', value: adminStats.pending_venues,      icon: '⏳', color: '#FF6B2B' },
                    { label: 'Total Users',    value: adminStats.total_users,         icon: '👤', color: '#00D4FF' },
                    { label: 'Checked In Now', value: adminStats.checked_in_now,      icon: '📍', color: '#8B5CF6' },
                    { label: 'Posts Today',    value: adminStats.posts_today,         icon: '📸', color: '#FF6B2B' },
                    { label: 'Flags Pending',  value: adminStats.flags_pending,       icon: '🚩', color: '#FF3B5C' },
                  ].map(s => (
                    <div key={s.label} className="glass-card" style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                        {s.value ?? '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="section-header">
                  <span className="section-title">This Week</span>
                </div>
                <div className="glass-card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Venue submissions</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#FF6B2B' }}>
                      {adminStats.submissions_this_week ?? 0}
                    </div>
                  </div>
                </div>

                <button
                  onClick={loadStats}
                  style={{
                    marginTop: 16, width: '100%', padding: '12px', borderRadius: 12,
                    border: '1px solid var(--border)', background: 'var(--bg-card)',
                    color: 'var(--text-muted)', fontFamily: 'var(--font-display)',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  ↻ Refresh Stats
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div
          onClick={() => setRejectModal(null)}
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
              background: 'var(--bg-card)', borderRadius: '24px 24px 0 0',
              border: '1px solid var(--border)', padding: '24px 24px 32px',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--border)', margin: '0 auto 20px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, textAlign: 'center' }}>
              Reject "{rejectModal.name}"?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 16 }}>
              Optional: leave a reason for the submitter.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason (e.g. already exists, wrong location...)"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '10px 14px', color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', fontSize: 14, resize: 'none',
                outline: 'none', marginBottom: 14,
              }}
            />
            <button
              onClick={confirmReject}
              disabled={rejecting}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, marginBottom: 10,
                border: '1px solid rgba(255,59,92,0.4)', background: 'rgba(255,59,92,0.12)',
                color: '#FF3B5C', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                cursor: rejecting ? 'not-allowed' : 'pointer',
              }}
            >
              {rejecting ? 'Rejecting...' : 'Confirm Reject'}
            </button>
            <button
              onClick={() => setRejectModal(null)}
              style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingRow() {
  return (
    <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
      Loading...
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{
      padding: '28px 20px', textAlign: 'center', borderRadius: 16,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}
