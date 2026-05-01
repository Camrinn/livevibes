import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { venues as mockVenues } from '../data/mockData'

// Real-time venue detail: vibe score, posts, who's here
export function useVenueDetail(venueId) {
  const [venue, setVenue]       = useState(null)
  const [posts, setPosts]       = useState([])
  const [whoIsHere, setWhoIsHere] = useState([])
  const [vibeScore, setVibeScore] = useState(0)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!venueId) return

    if (!isConfigured) {
      const mock = mockVenues.find(v => String(v.id) === String(venueId))
      setVenue(mock)
      setPosts(mock?.posts ?? [])
      setWhoIsHere(mock?.whoIsHere ?? [])
      setVibeScore(mock?.vibeScore ?? 0)
      setLoading(false)
      return
    }

    async function load() {
      const [venueRes, postsRes, checkinsRes, scoreRes] = await Promise.all([
        supabase.from('venues').select('*, deals(*)').eq('id', venueId).single(),
        supabase.from('posts').select('*, users(name, avatar_url)').eq('venue_id', venueId).order('created_at', { ascending: false }).limit(30),
        supabase.from('checkins').select('*, users(id, name, bio, avatar_url, visible)').eq('venue_id', venueId).eq('is_active', true),
        supabase.rpc('calculate_vibe_score', { p_venue_id: venueId }),
      ])

      if (venueRes.data) setVenue(venueRes.data)

      // Posts — fall back to mock posts until real ones exist
      if (postsRes.data && postsRes.data.length > 0) {
        setPosts(postsRes.data.map(p => ({
          id: p.id,
          user: p.users?.name ?? 'Someone',
          avatar: (p.users?.name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2),
          time: timeAgo(p.created_at),
          content: p.content,
          likes: p.likes ?? 0,
          hasMedia: Boolean(p.media_url),
          mediaUrl: p.media_url,
          mediaType: p.media_type ?? 'photo',
        })))
      } else {
        const { venues: mockVenues } = await import('../data/mockData.js')
        const mockVenue = mockVenues.find(v => String(v.id) === String(venueId) || v.name === venueRes.data?.name)
        setPosts(mockVenue?.posts ?? [])
      }

      // Who's Here — fall back to mock data until real users check in
      const realPeople = checkinsRes.data
        ? checkinsRes.data
            .filter(c => c.users?.visible)
            .map(c => ({
              id: c.users.id,
              name: c.users.name,
              avatar: (c.users.name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2),
              bio: c.users.bio ?? '',
              mutual: 0,
            }))
        : []

      if (realPeople.length > 0) {
        setWhoIsHere(realPeople)
      } else {
        // Use mock who's here until real check-ins exist
        const { venues: mockVenues } = await import('../data/mockData.js')
        const mockVenue = mockVenues.find(v => String(v.id) === String(venueId) || v.name === venueRes.data?.name)
        setWhoIsHere(mockVenue?.whoIsHere ?? [])
      }

      // Vibe score — use default_vibe_score from venue as fallback
      const liveScore = scoreRes.data
      const defaultScore = venueRes.data?.default_vibe_score ?? 0
      setVibeScore(liveScore || defaultScore)
      setLoading(false)
    }

    load()

    // Real-time: new posts
    const postSub = supabase
      .channel(`posts:${venueId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: `venue_id=eq.${venueId}` }, load)
      .subscribe()

    // Real-time: check-in/check-out changes
    const checkinSub = supabase
      .channel(`checkins:${venueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `venue_id=eq.${venueId}` }, load)
      .subscribe()

    // Real-time: new vibe votes
    const voteSub = supabase
      .channel(`votes:${venueId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vibe_votes', filter: `venue_id=eq.${venueId}` }, load)
      .subscribe()

    return () => {
      supabase.removeChannel(postSub)
      supabase.removeChannel(checkinSub)
      supabase.removeChannel(voteSub)
    }
  }, [venueId])

  return { venue, posts, setPosts, whoIsHere, vibeScore, loading }
}

function timeAgo(ts) {
  if (!ts) return ''
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}
