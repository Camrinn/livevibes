import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY

let placesPromise = null

export function loadPlaces() {
  if (!API_KEY) return Promise.resolve(null)
  if (!placesPromise) {
    setOptions({ key: API_KEY, v: 'weekly' })
    placesPromise = importLibrary('places').then(lib => lib)
  }
  return placesPromise
}

export function attachAutocomplete(inputEl, onSelect) {
  if (!API_KEY || !inputEl) return null
  return loadPlaces().then(places => {
    if (!places) return null
    const ac = new places.Autocomplete(inputEl, {
      types: ['establishment'],
      componentRestrictions: { country: 'us' },
      fields: ['name', 'formatted_address', 'geometry', 'types', 'place_id'],
    })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place.geometry) return
      onSelect({
        name: place.name ?? '',
        address: place.formatted_address ?? '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        placeId: place.place_id ?? null,
        googleTypes: place.types ?? [],
      })
    })
    return ac
  })
}
