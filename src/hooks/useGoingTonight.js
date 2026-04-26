import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

export function useGoingTonight(venueId, userId) {
  const [isGoing, setIsGoing]   = useState(false)
  const [count, setCount]       = useState(0)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!isConfigured || !venueId) return

    async function load() {
      const [countRes, goingRes] = await Promise.all([
        supabase.rpc('get_going_tonight_count', { p_venue_id: venueId }),
        userId
          ? supabase.from('going_tonight').select('id').eq('venue_id', venueId).eq('user_id', userId).maybeSingle()
          : Promise.resolve({ data: null }),
      ])
      setCount(countRes.data ?? 0)
      setIsGoing(Boolean(goingRes.data))
    }

    load()

    const sub = supabase
      .channel(`going:${venueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'going_tonight', filter: `venue_id=eq.${venueId}` }, load)
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [venueId, userId])

  async function toggle() {
    if (!isConfigured || !userId || loading) return
    setLoading(true)
    const prev = isGoing
    setIsGoing(!prev)
    setCount(c => prev ? Math.max(0, c - 1) : c + 1)
    try {
      const { data } = await supabase.rpc('toggle_going_tonight', { p_venue_id: venueId })
      setIsGoing(Boolean(data))
    } catch {
      setIsGoing(prev)
      setCount(c => prev ? c + 1 : Math.max(0, c - 1))
    } finally {
      setLoading(false)
    }
  }

  return { isGoing, count, toggle, loading }
}
