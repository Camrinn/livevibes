import { supabase, isConfigured } from '../lib/supabase'
import { isUserAtVenue } from '../lib/geo'

// Returns { checkIn, checkOut, voteVibe }
// All functions are async and return { success, error, warning }
export function useCheckin() {

  async function checkIn(venue, userId, onSuccess) {
    // 1. Verify location
    const { allowed, distance, warning } = await isUserAtVenue(venue)
    if (!allowed) {
      return { success: false, error: `You're ${distance}m away. Get within 200m of ${venue.name} to check in.` }
    }

    if (!isConfigured) {
      onSuccess?.()
      return { success: true, warning }
    }

    // 2. End any existing active check-in
    await supabase
      .from('checkins')
      .update({ is_active: false, checked_out_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_active', true)

    // 3. Create new check-in
    const { error } = await supabase
      .from('checkins')
      .insert({ user_id: userId, venue_id: venue.id })

    if (error) return { success: false, error: error.message }

    // 4. Award vibe points
    await supabase.rpc('increment_vibe_points', { p_user_id: userId, p_points: 20 })

    onSuccess?.()
    return { success: true, warning }
  }

  async function checkOut(userId) {
    if (!isConfigured) return { success: true }

    const { error } = await supabase
      .from('checkins')
      .update({ is_active: false, checked_out_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_active', true)

    return { success: !error, error: error?.message }
  }

  async function voteVibe(venueId, userId, rating) {
    if (!isConfigured) return { success: true }

    const { error } = await supabase
      .from('vibe_votes')
      .upsert({ user_id: userId, venue_id: venueId, rating }, { onConflict: 'user_id,venue_id' })

    return { success: !error, error: error?.message }
  }

  async function submitPost(venueId, userId, content, mediaFile) {
    if (!isConfigured) return { success: true }

    let media_url = null
    if (mediaFile) {
      const path = `posts/${venueId}/${userId}/${Date.now()}`
      const { error: uploadErr } = await supabase.storage
        .from('post-media')
        .upload(path, mediaFile, { cacheControl: '3600', upsert: false })
      if (uploadErr) return { success: false, error: uploadErr.message }
      const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(path)
      media_url = publicUrl
    }

    const { error } = await supabase
      .from('posts')
      .insert({ user_id: userId, venue_id: venueId, content, media_url })

    if (!error) {
      await supabase.rpc('increment_vibe_points', { p_user_id: userId, p_points: 15 })
    }

    return { success: !error, error: error?.message }
  }

  return { checkIn, checkOut, voteVibe, submitPost }
}
