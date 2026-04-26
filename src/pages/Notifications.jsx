import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useNotifications } from '../hooks/useNotifications'

export default function Notifications() {
  const navigate = useNavigate()
  const { user, setUnreadCount } = useApp()
  const {
    notifications, pendingRequests, unreadCount,
    loading, markRead, markAllRead, acceptRequest, declineRequest,
  } = useNotifications(user)

  // Keep global badge count in sync
  useEffect(() => {
    setUnreadCount(unreadCount)
  }, [unreadCount, setUnreadCount])

  const unreadNotifs = notifications.filter(n => !n.read)
  const readNotifs   = notifications.filter(n => n.read)
  const totalNew     = unreadNotifs.length + pendingRequests.length

  return (
    <div className="page">
      <div style={{ padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>
              Alerts
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {totalNew > 0 ? `${totalNew} new` : 'All caught up ✓'}
            </p>
          </div>
          {unreadNotifs.length > 0 && (
            <button
              onClick={markAllRead}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '0 16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 24, animation: 'pulse-dot 1.4s ease infinite' }}>⚡</div>
          </div>
        ) : (
          <>
            {/* ── Pending connection requests ── */}
            {pendingRequests.length > 0 && (
              <>
                <SectionLabel>Connection Requests</SectionLabel>
                {pendingRequests.map((req, i) => (
                  <div
                    key={req.connectionId}
                    className="animate-in"
                    style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
                  >
                    <div style={{
                      display: 'flex', gap: 12, padding: '14px 16px',
                      borderRadius: 16, marginBottom: 8,
                      background: 'rgba(139,92,246,0.07)',
                      border: '1px solid rgba(139,92,246,0.25)',
                    }}>
                      <div className="avatar" style={{
                        width: 44, height: 44, fontSize: 14, flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(255,107,43,0.2))',
                        border: '1.5px solid rgba(139,92,246,0.3)',
                      }}>
                        {req.requesterAvatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
                          <span style={{ color: '#8B5CF6' }}>{req.requesterName}</span>
                          {' '}wants to connect with you
                        </div>
                        {req.requesterInstagram && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            Instagram: @{req.requesterInstagram}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button
                            onClick={() => acceptRequest(req.connectionId, req.requesterId, req.requesterInstagram)}
                            style={{
                              flex: 1, padding: '8px 0', borderRadius: 10,
                              border: '1px solid rgba(16,245,135,0.4)',
                              background: 'rgba(16,245,135,0.1)',
                              color: '#10F587',
                              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => declineRequest(req.connectionId)}
                            style={{
                              flex: 1, padding: '8px 0', borderRadius: 10,
                              border: '1px solid rgba(255,59,92,0.3)',
                              background: 'rgba(255,59,92,0.06)',
                              color: '#FF3B5C',
                              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── Unread notifications ── */}
            {unreadNotifs.length > 0 && (
              <>
                <SectionLabel>New</SectionLabel>
                {unreadNotifs.map((notif, i) => (
                  <NotifCard
                    key={notif.id} notif={notif} i={i}
                    navigate={navigate} onRead={markRead}
                  />
                ))}
              </>
            )}

            {/* ── Read notifications ── */}
            {readNotifs.length > 0 && (
              <>
                {(unreadNotifs.length > 0 || pendingRequests.length > 0) && (
                  <SectionLabel style={{ marginTop: 20 }}>Earlier</SectionLabel>
                )}
                {readNotifs.map((notif, i) => (
                  <NotifCard
                    key={notif.id} notif={notif} i={i}
                    navigate={navigate} onRead={markRead}
                  />
                ))}
              </>
            )}

            {/* ── Empty state ── */}
            {notifications.length === 0 && pendingRequests.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No alerts yet</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Deals and activity will show up here</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-display)', fontSize: 11,
      fontWeight: 700, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.8px',
      marginBottom: 10, ...style,
    }}>
      {children}
    </div>
  )
}

function NotifCard({ notif, i, navigate, onRead }) {
  return (
    <div
      className="animate-in"
      style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
      onClick={() => {
        if (notif.venueId) navigate(`/venue/${notif.venueId}`)
        if (!notif.read) onRead(notif.id)
      }}
    >
      <div style={{
        display: 'flex', gap: 12, padding: '14px 16px',
        borderRadius: 16, marginBottom: 8,
        background: notif.read ? 'var(--bg-card)' : 'rgba(0,212,255,0.05)',
        border: notif.read ? '1px solid var(--border)' : '1px solid rgba(0,212,255,0.2)',
        cursor: notif.venueId ? 'pointer' : 'default',
        transition: 'all 0.15s', position: 'relative',
      }}>
        {!notif.read && (
          <div style={{
            position: 'absolute', top: 14, right: 14,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent-cyan)',
            boxShadow: '0 0 6px var(--accent-cyan)',
          }} />
        )}
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: getNotifBg(notif.type),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {notif.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {notif.venueName && (
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: getNotifColor(notif.type),
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2,
            }}>
              {notif.venueName}
            </div>
          )}
          <div style={{
            fontSize: 14,
            color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)',
            lineHeight: 1.4, fontWeight: notif.read ? 400 : 500,
          }}>
            {notif.message}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {formatTime(notif.createdAt)}
          </div>
        </div>
      </div>
    </div>
  )
}

function getNotifBg(type) {
  if (type === 'deal')   return 'rgba(16,245,135,0.12)'
  if (type === 'social') return 'rgba(139,92,246,0.12)'
  return 'rgba(255,107,43,0.12)'
}

function getNotifColor(type) {
  if (type === 'deal')   return '#10F587'
  if (type === 'social') return '#8B5CF6'
  return '#FF6B2B'
}

function formatTime(ts) {
  if (!ts) return ''
  if (typeof ts === 'string' && !ts.includes('T')) return ts // mock data strings
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (secs < 60)    return `${secs}s ago`
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}
