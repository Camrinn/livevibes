import React, { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import BottomNav from './components/BottomNav'
import SignUpModal from './components/SignUpModal'
import Home from './pages/Home'
import MapPage from './pages/MapPage'
import CheckIn from './pages/CheckIn'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import VenueDetail from './pages/VenueDetail'
import Onboarding from './pages/Onboarding'
import ProfileSetup from './pages/ProfileSetup'
import Auth from './pages/Auth'
import AddVenue from './pages/AddVenue'
import Admin from './pages/Admin'
import { isConfigured } from './lib/supabase'

// Captures /join/:code and redirects to auth, preserving the ref param
function JoinRedirect() {
  const { code } = useParams()
  if (code) localStorage.setItem('lv_ref', code)
  return <Navigate to={`/auth?ref=${code}`} replace />
}

function AppInner() {
  const location = useLocation()
  const { onboarded, isAuthenticated, authLoading, profileComplete, unreadCount, signUpVisible, closeSignUp } = useApp()

  const isOnboarding   = location.pathname === '/onboarding'
  const isAuth         = location.pathname === '/auth'
  const isProfileSetup = location.pathname === '/profile-setup'

  // Capture ?ref= param on any page load and persist to localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const ref = params.get('ref')
    if (ref) localStorage.setItem('lv_ref', ref)
  }, [location.search])

  if (authLoading) {
    return (
      <div style={{
        height: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
          background: 'linear-gradient(90deg, #FF6B2B, #FF3B5C)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'pulse-dot 1.4s ease infinite',
        }}>
          Live Vibes
        </div>
      </div>
    )
  }

  if (!onboarded && !isOnboarding && !isAuth) {
    return <Navigate to="/onboarding" replace />
  }

  if (isConfigured && isAuthenticated && !profileComplete && !isProfileSetup && !isOnboarding && !isAuth && !signUpVisible) {
    return <Navigate to="/profile-setup" replace />
  }

  const isAddVenue = location.pathname === '/add-venue'
  const isAdmin    = location.pathname === '/admin'
  const hideNav = isOnboarding || isAuth || isProfileSetup || isAddVenue || isAdmin

  return (
    <div className="app">
      <Routes>
        <Route path="/onboarding"    element={<Onboarding />} />
        <Route path="/auth"          element={<Auth />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/join/:code"    element={<JoinRedirect />} />
        <Route path="/"              element={<Home />} />
        <Route path="/map"           element={<MapPage />} />
        <Route path="/checkin"       element={<CheckIn />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile"       element={<Profile />} />
        <Route path="/venue/:id"     element={<VenueDetail />} />
        <Route path="/add-venue"     element={<AddVenue />} />
        <Route path="/admin"         element={<Admin />} />
      </Routes>
      {!hideNav && <BottomNav unreadCount={unreadCount} />}
      {isConfigured && signUpVisible && !isAuthenticated && <SignUpModal onClose={closeSignUp} />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
