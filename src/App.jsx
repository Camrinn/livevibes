import React from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import MapPage from './pages/MapPage'
import CheckIn from './pages/CheckIn'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import VenueDetail from './pages/VenueDetail'
import Onboarding from './pages/Onboarding'
import { notifications } from './data/mockData'

function AppInner() {
  const location = useLocation()
  const { onboarded } = useApp()
  const isOnboarding = location.pathname === '/onboarding'
  const unreadCount = notifications.filter(n => !n.read).length

  if (!onboarded && !isOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/venue/:id" element={<VenueDetail />} />
      </Routes>
      {!isOnboarding && <BottomNav unreadCount={unreadCount} />}
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
