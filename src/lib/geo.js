const CHECKIN_RADIUS_METERS = 200

// Haversine distance between two lat/lng points in meters
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = deg => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Returns a promise resolving to the user's current position
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    })
  })
}

// Returns true if user is within CHECKIN_RADIUS_METERS of the venue
export async function isUserAtVenue(venue) {
  try {
    const position = await getCurrentPosition()
    const { latitude, longitude } = position.coords
    const dist = getDistance(latitude, longitude, venue.lat, venue.lng)
    return { allowed: dist <= CHECKIN_RADIUS_METERS, distance: Math.round(dist) }
  } catch (err) {
    // If user denies location or device lacks GPS, allow with warning
    console.warn('Geolocation unavailable:', err.message)
    return { allowed: true, distance: null, warning: 'Location unavailable' }
  }
}

// Compute straight-line distance label (e.g. "0.3 mi") from user to venue
export function formatDistance(userLat, userLng, venueLat, venueLng) {
  const meters = getDistance(userLat, userLng, venueLat, venueLng)
  const miles = meters / 1609.34
  return miles < 0.1 ? 'Here' : `${miles.toFixed(1)} mi`
}
