import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { attachAutocomplete } from '../lib/places'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const VENUE_TYPES = [
  'Sports Bar', 'Live Music Bar', 'Irish Pub', 'Nightclub',
  'Rooftop Bar', 'Latin Club', 'Music Venue', 'Garden Bar', 'Waterfront Bar',
]

const TYPE_COLOR = {
  'Sports Bar': '#FF6B2B', 'Live Music Bar': '#8B5CF6', 'Irish Pub': '#10F587',
  'Nightclub': '#FF3B5C', 'Rooftop Bar': '#8B5CF6', 'Latin Club': '#FF6B2B',
  'Music Venue': '#00D4FF', 'Garden Bar': '#10F587', 'Waterfront Bar': '#00D4FF',
}

const ALL_TAGS = [
  'Cocktails', 'Craft Beer', 'Live Music', 'Dancing', 'Sports', 'Happy Hour',
  'Rooftop', 'DJ', 'Trivia Night', 'Karaoke', 'Pool Table', 'Outdoor Seating',
  'Late Night', 'Bottle Service', 'Whiskey', 'Wine Bar', 'Darts', 'Brunch',
]

const VENUE_EMOJI = {
  'Sports Bar': '🏈', 'Live Music Bar': '🎸', 'Irish Pub': '🍺',
  'Nightclub': '🎧', 'Rooftop Bar': '🌃', 'Latin Club': '💃',
  'Music Venue': '🎵', 'Garden Bar': '🌿', 'Waterfront Bar': '⚓',
}

async function geocodeAddress(address) {
  if (!MAPBOX_TOKEN) return null
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=US&types=poi,address`
  const res = await fetch(url)
  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature) return null
  const [lng, lat] = feature.center
  return { lat, lng, displayName: feature.place_name }
}

export default function AddVenue() {
  const navigate = useNavigate()
  const { user, dbUser } = useApp()

  const [canSubmit, setCanSubmit]   = useState(true)
  const [step, setStep]             = useState(0)
  const [name, setName]             = useState('')
  const [type, setType]             = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress]       = useState('')
  const [geoResult, setGeoResult]   = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError]     = useState('')
  const [tags, setTags]             = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')

  const nameInputRef    = useRef(null)
  const addressInputRef = useRef(null)

  // Attach Google Places autocomplete to the venue name field
  useEffect(() => {
    if (step !== 0 || !nameInputRef.current) return
    const cleanup = attachAutocomplete(nameInputRef.current, (place) => {
      setName(place.name)
      setAddress(place.address)
      setGeoResult({ lat: place.lat, lng: place.lng, displayName: place.address })
      setGeoError('')
    })
    return () => { cleanup?.then(ac => ac?.unbindAll?.()) }
  }, [step])

  // Attach Google Places autocomplete to the address field (Step 1)
  useEffect(() => {
    if (step !== 1 || !addressInputRef.current) return
    const cleanup = attachAutocomplete(addressInputRef.current, (place) => {
      setAddress(place.address)
      setGeoResult({ lat: place.lat, lng: place.lng, displayName: place.address })
      setGeoError('')
    })
    return () => { cleanup?.then(ac => ac?.unbindAll?.()) }
  }, [step])

  // Check submission eligibility in background (admins bypass the age/rate limit check)
  useEffect(() => {
    if (!isConfigured || !dbUser?.id || user?.isAdmin) return
    supabase.rpc('can_submit_venue', { p_user_id: dbUser.id })
      .then(({ data }) => { if (data === false) setCanSubmit(false) })
  }, [dbUser?.id, user?.isAdmin])

  const steps = ['The basics', 'Location', 'Vibe tags']
  const progress = ((step + 1) / steps.length) * 100

  function toggleTag(tag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag].slice(0, 5))
  }

  async function lookupAddress() {
    if (!address.trim()) return
    setGeoLoading(true)
    setGeoError('')
    setGeoResult(null)
    const result = await geocodeAddress(address.trim())
    if (!result) {
      setGeoError('Address not found. Try being more specific (include city).')
    } else {
      setGeoResult(result)
    }
    setGeoLoading(false)
  }

  async function handleSubmit() {
    if (!name.trim() || !type || !geoResult) return
    setSubmitting(true)
    setError('')

    if (!isConfigured) {
      setDone(true)
      setSubmitting(false)
      return
    }

    // Final server-side eligibility check (admins bypass)
    if (!user?.isAdmin) {
      const { data: allowed } = await supabase.rpc('can_submit_venue', { p_user_id: dbUser?.id })
      if (allowed === false) {
        setError('You can\'t submit right now. Accounts must be 7+ days old and max 3 submissions per day.')
        setSubmitting(false)
        setCanSubmit(false)
        return
      }
    }

    const payload = {
      name: name.trim(),
      type,
      description: description.trim() || null,
      address: geoResult.displayName,
      lat: geoResult.lat,
      lng: geoResult.lng,
      tags: tags.length ? tags : [type],
      color: TYPE_COLOR[type] ?? '#FF6B2B',
      status: 'pending',
      submitted_by: dbUser?.id ?? null,
      submitted_at: new Date().toISOString(),
      default_vibe_score: 75,
      default_checkin_count: 0,
      trending: false,
    }

    const { error: err } = await supabase.from('venues').insert(payload)
    if (err) {
      setError(err.message)
      setSubmitting(false)
      return
    }

    // Log submission for spam tracking
    if (dbUser?.id) {
      await supabase.from('venue_submissions_log').insert({
        submitter_id: dbUser.id,
        venue_name: name.trim(),
      })
    }

    setDone(true)
    setSubmitting(false)
  }

  function nextStep() {
    if (step === 0) {
      if (!name.trim()) { setError('Enter a venue name'); return }
      if (!type) { setError('Select a venue type'); return }
    }
    if (step === 1) {
      if (!geoResult) { setError('Look up and confirm the address first'); return }
    }
    setError('')
    if (step < steps.length - 1) setStep(s => s + 1)
    else handleSubmit()
  }

  // Gate: account too new or daily limit reached
  if (!canSubmit) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 28px', background: 'var(--bg-primary)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>⏳</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
          Not yet
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          To prevent spam, venue submissions require an account that's at least 7 days old, and a maximum of 3 submissions per day.
        </p>
        <button className="btn-primary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    )
  }

  if (done) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 28px', background: 'var(--bg-primary)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 72, marginBottom: 24 }}>🎉</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
          color: 'var(--text-primary)', marginBottom: 12,
        }}>
          Venue Submitted!
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{name}</strong> is pending review.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
          It'll go live once an admin approves it, or after 3 people check in there.
        </p>
        <button className="btn-primary" onClick={() => navigate('/map')}>Back to Map</button>
        <button
          onClick={() => { setDone(false); setStep(0); setName(''); setType(''); setAddress(''); setGeoResult(null); setTags([]) }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, marginTop: 12, cursor: 'pointer' }}
        >
          Submit another venue
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--border)' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #FF6B2B, #FF3B5C)',
          transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{ flex: 1, padding: '48px 24px 0', display: 'flex', flexDirection: 'column' }}>
        {/* Back + step */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button
            onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← {step === 0 ? 'Back' : 'Previous'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '1px' }}>
            {step + 1} / {steps.length}
          </p>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
          color: 'var(--text-primary)', marginBottom: 6,
        }}>
          {steps[step]}
        </h1>

        {/* Step 0 — Basics */}
        {step === 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              What's the spot called and what kind of place is it?
            </p>
            <input
              autoFocus
              ref={nameInputRef}
              className="input-field"
              placeholder="Venue name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && nextStep()}
              style={{ marginBottom: 16 }}
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              maxLength={200}
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '10px 14px', color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', fontSize: 14, resize: 'none',
                outline: 'none', marginBottom: 16,
              }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>Venue type</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {VENUE_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    padding: '12px 10px', borderRadius: 14, textAlign: 'left',
                    border: type === t ? `1.5px solid ${TYPE_COLOR[t]}` : '1.5px solid var(--border)',
                    background: type === t ? `${TYPE_COLOR[t]}14` : 'var(--bg-card)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{VENUE_EMOJI[t]}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)',
                    color: type === t ? TYPE_COLOR[t] : 'var(--text-secondary)',
                  }}>
                    {t}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Location */}
        {step === 1 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Enter the street address. We'll pin it on the map.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                autoFocus
                ref={addressInputRef}
                className="input-field"
                placeholder="123 Main St, Philadelphia, PA"
                value={address}
                onChange={e => { setAddress(e.target.value); setGeoResult(null); setGeoError('') }}
                onKeyDown={e => e.key === 'Enter' && lookupAddress()}
                style={{ flex: 1 }}
              />
              <button
                onClick={lookupAddress}
                disabled={geoLoading || !address.trim()}
                style={{
                  padding: '0 16px', borderRadius: 14, flexShrink: 0,
                  border: '1px solid var(--border-active)',
                  background: 'var(--bg-card)', color: 'var(--accent-cyan)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  opacity: geoLoading || !address.trim() ? 0.5 : 1,
                }}
              >
                {geoLoading ? '...' : 'Find'}
              </button>
            </div>

            {geoError && (
              <p style={{ fontSize: 13, color: '#FF3B5C', marginBottom: 12 }}>{geoError}</p>
            )}

            {geoResult && (
              <div style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'rgba(16,245,135,0.06)', border: '1px solid rgba(16,245,135,0.25)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 20, marginTop: 2 }}>📍</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#10F587', marginBottom: 4 }}>
                    Location confirmed
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {geoResult.displayName}
                  </div>
                </div>
              </div>
            )}

            {!geoResult && !geoError && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                Tip: include "Philadelphia" for better results
              </p>
            )}
          </div>
        )}

        {/* Step 2 — Tags */}
        {step === 2 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              What's the vibe? Pick up to 5 tags.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              {tags.length}/5 selected
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_TAGS.map(tag => {
                const selected = tags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: '8px 14px', borderRadius: 999,
                      border: selected ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border)',
                      background: selected ? 'rgba(0,212,255,0.1)' : 'var(--bg-card)',
                      color: selected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      transition: 'all 0.15s',
                      opacity: !selected && tags.length >= 5 ? 0.4 : 1,
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 13, color: '#FF3B5C', textAlign: 'center', padding: '8px 24px' }}>
          {error}
        </p>
      )}

      {/* CTA */}
      <div style={{ padding: '16px 24px 40px' }}>
        <button
          className="btn-primary"
          onClick={nextStep}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : step < steps.length - 1 ? 'Continue →' : 'Submit Venue 🎉'}
        </button>
      </div>
    </div>
  )
}
