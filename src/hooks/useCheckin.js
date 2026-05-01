import { supabase, isConfigured } from '../lib/supabase'
import { isUserAtVenue } from '../lib/geo'
import { compressImage, isVideo, validateMedia } from '../lib/media'

export function useCheckin() {

  async function checkIn(venue, userId, onSuccess) {
    const { allowed, distance, warning } = await isUserAtVenue(venue)
    if (!allowed) {
      return { success: false, error: `You're ${distance}m away. Get within 200m of ${venue.name} to check in.` }
    }

    if (!isConfigured) {
      onSuccess?.()
      return { success: true, warning }
    }

    await supabase
      .from('checkins')
      .update({ is_active: false, checked_out_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_active', true)

    const { error } = await supabase
      .from('checkins')
      .insert({ user_id: userId, venue_id: venue.id })

    if (error) return { success: false, error: error.message }

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

    // Server-side rate limit + check-in enforcement
    const { data: canPost } = await supabase.rpc('can_user_post', { p_venue_id: venueId })
    if (!canPost) {
      return { success: false, error: 'You must be checked in to post. Max 5 posts per hour per venue.' }
    }

    let media_url  = null
    let media_type = null

    if (mediaFile) {
      const validationError = validateMedia(mediaFile)
      if (validationError) return { success: false, error: validationError }

      const isVid       = isVideo(mediaFile)
      const fileToUpload = isVid ? mediaFile : await compressImage(mediaFile)
      const ext         = isVid ? 'mp4' : 'jpg'
      const path        = `posts/${venueId}/${userId}/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('post-media')
        .upload(path, fileToUpload, { cacheControl: '3600', upsert: false })
      if (uploadErr) return { success: false, error: uploadErr.message }

      const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(path)
      media_url  = publicUrl
      media_type = isVid ? 'video' : 'photo'
    }

    const { error } = await supabase
      .from('posts')
      .insert({ user_id: userId, venue_id: venueId, content, media_url, media_type })

    if (!error) {
      await supabase.rpc('increment_vibe_points', { p_user_id: userId, p_points: 15 })
    }

    return { success: !error, error: error?.message }
  }

  async function flagPost(postId, userId, reason, notes = null) {
    if (!isConfigured) return { success: true }
    const { error } = await supabase
      .from('post_flags')
      .insert({ post_id: postId, reporter_id: userId, reason, notes })
    return { success: !error, error: error?.message }
  }

  return { checkIn, checkOut, voteVibe, submitPost, flagPost }
}
