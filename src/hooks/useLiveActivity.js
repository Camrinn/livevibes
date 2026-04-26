import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { liveActivity as mockActivity, friends as mockFriends, cityStats } from '../data/mockData'

export function useLiveActivity(userId) {
  const [activity, setActivity]     = useState([])
  const [friendsOut, setFriendsOut] = useState([])
  const [peopleOut, setPeopleOut]   = useState(0)
  const [loading, setLoading]       = useState(true)

  const load = useCallback(async () => {
    if (!isConfigured) {
      setActivity(mockActivity.map(a => ({
        id: a.id, userName: a.user, venueName: a.venue,
        venueId: a.venueId, action: a.action, time: a.time,
      })))
      setFriendsOut(mockFriends.map(f => ({
        id: f.id, name: f.name, avatar: f.avatar,
        venueId: f.venueId, venueName: f.venueName,
      })))
      setPeopleOut(cityStats.totalOut)
      setLoading(false)
      return
    }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    const [activityRes, countRes] = await Promise.all([
      supabase
        .from('checkins')
        .select('id, created_at, venue_id, users(name), venues(id, name)')
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('checkins')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
    ])

    if (activityRes.data) {
      setActivity(activityRes.data.map(c => ({
        id: c.id,
        userName: c.users?.name ?? 'Someone',
        venueName: c.venues?.name ?? 'a venue',
        venueId: c.venue_id,
        action: 'checked into',
        time: timeAgo(c.created_at),
      })))
    }

    setPeopleOut(countRes.count ?? 0)

    // Friends: accepted connections that are currently checked in
    if (userId) {
      const { data: conns } = await supabase
        .from('connections')
        .select('requester_id, target_id')
        .or(`requester_id.eq.${userId},target_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (conns && conns.length > 0) {
        const friendIds = conns.map(c =>
          c.requester_id === userId ? c.target_id : c.requester_id
        )
        const { data: friendCheckins } = await supabase
          .from('checkins')
          .select('user_id, venue_id, users(name), venues(name)')
          .in('user_id', friendIds)
          .eq('is_active', true)

        if (friendCheckins) {
          setFriendsOut(friendCheckins.map(c => ({
            id: c.user_id,
            name: c.users?.name ?? 'Friend',
            avatar: (c.users?.name ?? 'F').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            venueId: c.venue_id,
            venueName: c.venues?.name ?? '',
          })))
        }
      } else {
        setFriendsOut([])
      }
    }

    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
    if (!isConfigured) return

    const sub = supabase
      .channel('live-activity-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkins' }, load)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'checkins' }, load)
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [load])

  return { activity, friendsOut, peopleOut, loading }
}

function timeAgo(ts) {
  if (!ts) return ''
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}
