import React, { createContext, useContext, useState } from 'react'
import { currentUser } from '../data/mockData'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [checkedInVenueId, setCheckedInVenueId] = useState(null)
  const [onboarded, setOnboarded] = useState(false)
  const [vibePoints, setVibePoints] = useState(currentUser.vibePoints)
  const [checkInCount, setCheckInCount] = useState(currentUser.checkIns)

  const checkIn = (venueId) => {
    setCheckedInVenueId(venueId)
    setVibePoints(p => p + 20)
    setCheckInCount(c => c + 1)
  }

  const checkOut = () => setCheckedInVenueId(null)

  return (
    <AppContext.Provider value={{
      checkedInVenueId,
      checkIn,
      checkOut,
      onboarded,
      setOnboarded,
      vibePoints,
      checkInCount,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
