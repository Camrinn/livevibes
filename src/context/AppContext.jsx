import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { currentUser as mockUser } from '../data/mockData'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession]                   = useState(null)
  const [dbUser, setDbUser]                     = useState(null)
  const [authLoading, setAuthLoading]           = useState(true)
  const [checkedInVenueId, setCheckedInVenueId] = useState(null)
  const [checkedInAt, setCheckedInAt]           = useState(null)
  const [onboarded, setOnboarded]               = useState(false)
  const [vibePoints, setVibePoints]             = useState(mockUser.vibePoints)
  const [checkInCount, setCheckInCount]         = useState(mockUser.checkIns)
  const [profileComplete, setProfileComplete]   = useState(false)
  const [unreadCount, setUnreadCount]           = useState(0)

  const loadDbUser = useCallback(async (userId) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single()
    if (data) {
      setDbUser(data)
      setVibePoints(data.vibe_points ?? 0)
      setCheckInCount(data.check_in_count ?? 0)
      setProfileComplete(data.profile_complete ?? false)
    }

    const { data: checkin } = await supabase
      .from('checkins')
      .select('venue_id, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (checkin) {
      setCheckedInVenueId(checkin.venue_id)
      setCheckedInAt(checkin.created_at)
    } else {
      setCheckedInAt(null)
    }
    setAuthLoading(false)
  }, [])

  useEffect(() => {
    if (!isConfigured) {
      setOnboarded(true)
      setProfileComplete(true)
      setAuthLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadDbUser(session.user.id)
      else setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadDbUser(session.user.id)
      else { setDbUser(null); setProfileComplete(false); setAuthLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [loadDbUser])

  const refreshUser = useCallback(async () => {
    if (!session) return
    await loadDbUser(session.user.id)
  }, [session, loadDbUser])

  const checkIn = (venueId) => {
    setCheckedInVenueId(venueId)
    setCheckedInAt(new Date().toISOString())
    setVibePoints(p => p + 20)
    setCheckInCount(c => c + 1)
  }

  const checkOut = () => {
    setCheckedInVenueId(null)
    setCheckedInAt(null)
  }

  const signOut = async () => {
    if (isConfigured) await supabase.auth.signOut()
    setSession(null)
    setDbUser(null)
    setProfileComplete(false)
    setCheckedInVenueId(null)
  }

  const user = isConfigured && dbUser
    ? {
        id: dbUser.id,
        name: dbUser.name ?? 'You',
        handle: dbUser.handle ?? '',
        avatar: (dbUser.name ?? 'ME').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        bio: dbUser.bio ?? '',
        mode: dbUser.mode ?? 'vibing',
        age: dbUser.age ?? null,
        instagram: dbUser.instagram_handle ?? null,
        inviteCode: dbUser.invite_code ?? dbUser.id?.slice(0, 8) ?? null,
        vibePoints,
        checkIns: checkInCount,
      }
    : { ...mockUser, vibePoints, checkIns: checkInCount, mode: 'vibing', age: null, instagram: null }

  const isAuthenticated = isConfigured ? Boolean(session) : true

  return (
    <AppContext.Provider value={{
      session,
      user,
      dbUser,
      isAuthenticated,
      authLoading,
      checkedInVenueId,
      checkedInAt,
      checkIn,
      checkOut,
      signOut,
      onboarded,
      setOnboarded,
      profileComplete,
      refreshUser,
      vibePoints,
      checkInCount,
      unreadCount,
      setUnreadCount,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
