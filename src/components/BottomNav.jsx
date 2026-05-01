import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const navItems = [
  {
    path: '/',
    label: 'Explore',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    )
  },
  {
    path: '/map',
    label: 'Map',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    )
  },
  {
    path: '/checkin',
    label: '',
    icon: () => null,
    isCenter: true,
  },
  {
    path: '/notifications',
    label: 'Alerts',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    )
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    )
  },
]

const GUEST_BLOCKED = ['/checkin', '/notifications', '/profile']

export default function BottomNav({ unreadCount = 0 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, openSignUp } = useApp()

  function handleNavClick(path) {
    if (!isAuthenticated && GUEST_BLOCKED.includes(path)) {
      openSignUp()
      return
    }
    navigate(path)
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      height: 'var(--nav-height)',
      paddingBottom: 'var(--safe-bottom)',
      background: 'rgba(10, 10, 18, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 100,
      paddingLeft: 8,
      paddingRight: 8,
    }}>
      {navItems.map((item) => {
        const active = location.pathname === item.path
        if (item.isCenter) {
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B2B, #FF3B5C)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(255,107,43,0.5)',
                flexShrink: 0,
                marginTop: -20,
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Plus / Check-in icon */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </button>
          )
        }
        return (
          <button
            key={item.path}
            onClick={() => handleNavClick(item.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
              padding: '6px 0',
              position: 'relative',
              transition: 'color 0.2s',
            }}
          >
            {item.icon(active)}
            <span style={{
              fontSize: 10,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              {item.label}
            </span>
            {/* Notification badge */}
            {item.path === '/notifications' && unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 4,
                right: '18%',
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'var(--accent-orange)',
                color: 'white',
                fontSize: 9,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-primary)',
              }}>
                {unreadCount}
              </span>
            )}
            {/* Active dot */}
            {active && (
              <span style={{
                position: 'absolute',
                bottom: 0,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'var(--accent-cyan)',
                boxShadow: '0 0 6px var(--accent-cyan)',
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
