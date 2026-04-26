import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { notifications as mockNotifs } from '../data/mockData'

export function useNotifications(user) {
  const [notifications, setNotifications]     = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading]                 = useState(true)

  const unreadCount = notifications.filter(n => !n.read).length + pendingRequests.length

  const load = useCallback(async () => {
    if (!isConfigured || !user?.id) {
      setNotifications(mockNotifs.map(n => ({
        id: n.id, type: n.type, icon: n.icon,
        message: n.message, venueName: n.venue,
        venueId: n.venueId, read: n.read, createdAt: n.time,
      })))
      setLoading(false)
      return
    }

    const [notifsRes, pendingRes] = await Promise.all([
      supabase
        .from('notifications')
        .select('*, venues(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40),

      supabase
        .from('connections')
        .select('id, created_at, requester_instagram, requester:requester_id(id, name)')
        .eq('target_id', user.id)
        .eq('status', 'pending'),
    ])

    if (notifsRes.data) {
      setNotifications(notifsRes.data.map(n => ({
        id: n.id,
        type: n.type,
        icon: n.icon,
        message: n.message,
        venueName: n.venues?.name ?? null,
        venueId: n.venue_id,
        read: n.read,
        createdAt: n.created_at,
      })))
    }

    if (pendingRes.data) {
      setPendingRequests(pendingRes.data.map(c => ({
        connectionId: c.id,
        requesterId: c.requester?.id,
        requesterName: c.requester?.name ?? 'Someone',
        requesterAvatar: (c.requester?.name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        requesterInstagram: c.requester_instagram,
        createdAt: c.created_at,
      })))
    }

    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    load()
    if (!isConfigured || !user?.id) return

    const notifSub = supabase
      .channel(`notifs:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, load)
      .subscribe()

    const connSub = supabase
      .channel(`conns:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections', filter: `target_id=eq.${user.id}` }, load)
      .subscribe()

    return () => {
      supabase.removeChannel(notifSub)
      supabase.removeChannel(connSub)
    }
  }, [load, user?.id])

  async function markRead(notifId) {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    if (isConfigured) {
      await supabase.from('notifications').update({ read: true }).eq('id', notifId)
    }
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (isConfigured && user?.id) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    }
  }

  async function acceptRequest(connectionId, requesterId, requesterInstagram) {
    // Optimistic remove
    setPendingRequests(prev => prev.filter(r => r.connectionId !== connectionId))

    if (!isConfigured) return

    // Update connection status + share target's instagram
    await supabase.from('connections').update({
      status: 'accepted',
      target_instagram: user.instagram ?? null,
    }).eq('id', connectionId)

    // Notify requester
    const igMessage = user.instagram
      ? `${user.name} accepted your connection! Their Instagram: @${user.instagram}`
      : `${user.name} accepted your connection request!`

    await supabase.from('notifications').insert({
      user_id: requesterId,
      type: 'social',
      icon: '🤝',
      message: igMessage,
    })

    // Show the requester's instagram in a notification to self if they shared it
    if (requesterInstagram) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'social',
        icon: '✅',
        message: `Connection accepted! Their Instagram: @${requesterInstagram}`,
        read: false,
      })
    }

    await load()
  }

  async function declineRequest(connectionId) {
    setPendingRequests(prev => prev.filter(r => r.connectionId !== connectionId))
    if (isConfigured) {
      await supabase.from('connections').delete().eq('id', connectionId)
    }
  }

  return {
    notifications,
    pendingRequests,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    acceptRequest,
    declineRequest,
    reload: load,
  }
}
