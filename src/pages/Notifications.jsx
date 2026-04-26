import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notifications } from '../data/mockData'

export default function Notifications() {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState(notifications)

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <div className="page">
      <div style={{ padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
              color: 'var(--text-primary)',
            }}>
              Alerts
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {unread > 0 ? `${unread} new notifications` : 'All caught up ✓'}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: 'none', border: 'none',
                color: 'var(--accent-cyan)', fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '0 16px 20px' }}>
        {/* Unread section */}
        {unread > 0 && (
          <>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 11,
              fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.8px',
              marginBottom: 10,
            }}>
              New
            </div>
            {notifs.filter(n => !n.read).map((notif, i) => (
              <NotifCard key={notif.id} notif={notif} i={i} navigate={navigate} setNotifs={setNotifs} />
            ))}
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 11,
              fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.8px',
              marginTop: 20, marginBottom: 10,
            }}>
              Earlier
            </div>
          </>
        )}

        {notifs.filter(n => n.read).map((notif, i) => (
          <NotifCard key={notif.id} notif={notif} i={i} navigate={navigate} setNotifs={setNotifs} />
        ))}

        {notifs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No alerts yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Deals and activity will show up here</div>
          </div>
        )}
      </div>
    </div>
  )
}

function NotifCard({ notif, i, navigate, setNotifs }) {
  return (
    <div
      className="animate-in"
      style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
      onClick={() => {
        if (notif.venueId) navigate(`/venue/${notif.venueId}`)
        setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
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
        {/* Unread dot */}
        {!notif.read && (
          <div style={{
            position: 'absolute', top: 14, right: 14,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent-cyan)',
            boxShadow: '0 0 6px var(--accent-cyan)',
          }} />
        )}

        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: getNotifBg(notif.type),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {notif.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {notif.venue && (
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: getNotifColor(notif.type),
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2,
            }}>
              {notif.venue}
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
            {notif.time}
          </div>
        </div>
      </div>
    </div>
  )
}

function getNotifBg(type) {
  if (type === 'deal') return 'rgba(16,245,135,0.12)'
  if (type === 'social') return 'rgba(139,92,246,0.12)'
  return 'rgba(255,107,43,0.12)'
}

function getNotifColor(type) {
  if (type === 'deal') return '#10F587'
  if (type === 'social') return '#8B5CF6'
  return '#FF6B2B'
}
