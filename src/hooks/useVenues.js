import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { venues as mockVenues } from '../data/mockData'

// Returns venues with live vibe scores attached.
// Falls back to mock data when Supabase is not configured.
export function useVenues() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setVenues(mockVenues)
      setLoading(false)
      return
    }

    async function load() {
      const { data: venueRows, error } = await supabase
        .from('venues')
        .select(`
          *,
          deals(text, ends_at, active),
          checkin_count:checkins(count)
        `)
        .order('name')

      if (error || !venueRows) {
        setVenues(mockVenues)
        setLoading(false)
        return
      }

      // Fetch vibe scores for all venues in parallel
      const scores = await Promise.all(
        venueRows.map(v =>
          supabase.rpc('calculate_vibe_score', { p_venue_id: v.id })
            .then(({ data }) => ({ id: v.id, score: data ?? 0 }))
        )
      )

      const scoreMap = Object.fromEntries(scores.map(s => [s.id, s.score]))

      const shaped = venueRows.map(v => ({
        ...v,
        vibeScore: scoreMap[v.id] || v.default_vibe_score || 0,
        checkedIn: v.checkin_count?.[0]?.count || v.default_checkin_count || 0,
        deal: v.deals?.find(d => d.active) ?? null,
        trending: v.trending ?? false,
        posts: [],
        whoIsHere: [],
      }))

      setVenues(shaped)
      setLoading(false)
    }

    load()

    // Real-time: re-fetch when any check-in or vote changes
    const checkinSub = supabase
      .channel('global:checkins')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, load)
      .subscribe()

    const voteSub = supabase
      .channel('global:vibe_votes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vibe_votes' }, load)
      .subscribe()

    return () => {
      supabase.removeChannel(checkinSub)
      supabase.removeChannel(voteSub)
    }
  }, [])

  return { venues, loading }
}
