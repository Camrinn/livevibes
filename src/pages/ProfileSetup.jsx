import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const MODES = [
  {
    value: 'friends',
    emoji: '👥',
    label: 'Friends Mode',
    sub: 'Hanging with my crew, not looking to meet strangers',
    color: '#00D4FF',
  },
  {
    value: 'vibing',
    emoji: '😎',
    label: 'Vibing',
    sub: 'Open to meeting people, no pressure',
    color: '#8B5CF6',
  },
  {
    value: 'connect',
    emoji: '🔥',
    label: 'Connect',
    sub: 'Looking to meet new people tonight',
    color: '#FF6B2B',
  },
]

export default function ProfileSetup() {
  const navigate  = useNavigate()
  const { session, refreshUser } = useApp()
  const [step, setStep]           = useState(0)
  const [name, setName]           = useState('')
  const [age, setAge]             = useState('')
  const [mode, setMode]           = useState('vibing')
  const [instagram, setInstagram] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const steps = ['Who are you?', 'Your age', 'Tonight\'s mode', 'Instagram (optional)']
  const progress = ((step) / steps.length) * 100

  async function handleFinish() {
    if (!name.trim()) { setError('Name is required'); return }
    const ageNum = parseInt(age, 10)
    if (age && (isNaN(ageNum) || ageNum < 18 || ageNum > 99)) {
      setError('Age must be 18–99')
      return
    }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('users').update({
      name: name.trim(),
      age: age ? ageNum : null,
      mode,
      instagram_handle: instagram.replace(/^@/, '').trim() || null,
      profile_complete: true,
    }).eq('id', session.user.id)

    if (err) { setSaving(false); setError(err.message); return }

    // Apply referral if one was captured before signup
    const refCode = localStorage.getItem('lv_ref')
    if (refCode && isConfigured) {
      await supabase.rpc('apply_referral', {
        p_new_user_id: session.user.id,
        p_invite_code: refCode,
      })
      localStorage.removeItem('lv_ref')
    }

    await refreshUser()
    navigate('/', { replace: true })
  }

  function nextStep() {
    if (step === 0 && !name.trim()) { setError('Enter your name to continue'); return }
    if (step === 1) {
      const ageNum = parseInt(age, 10)
      if (age && (isNaN(ageNum) || ageNum < 18 || ageNum > 99)) { setError('Age must be 18–99'); return }
    }
    setError('')
    if (step < steps.length - 1) setStep(s => s + 1)
    else handleFinish()
  }

  const selectedMode = MODES.find(m => m.value === mode)

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 0 40px',
    }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--border)' }}>
        <div style={{
          height: '100%',
          width: `${progress + (1 / steps.length) * 100}%`,
          background: 'linear-gradient(90deg, #FF6B2B, #FF3B5C)',
          transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{ flex: 1, padding: '48px 24px 0', display: 'flex', flexDirection: 'column' }}>
        {/* Step indicator */}
        <p style={{
          fontSize: 12, color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)', fontWeight: 700,
          letterSpacing: '1px', marginBottom: 8,
        }}>
          STEP {step + 1} OF {steps.length}
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28, fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: 8, lineHeight: 1.15,
        }}>
          {steps[step]}
        </h1>

        {/* Step 0 — Name */}
        {step === 0 && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              This is how you'll appear to others at venues.
            </p>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && nextStep()}
              placeholder="Your first name"
              maxLength={30}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-active)',
                borderRadius: 14, padding: '16px 18px',
                fontSize: 18, color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)', fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Step 1 — Age */}
        {step === 1 && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Shown next to your name on the Who's Here list. You must be 21+ to use this app.
            </p>
            <input
              autoFocus
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && nextStep()}
              placeholder="Your age (e.g. 24)"
              min={18} max={99}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-active)',
                borderRadius: 14, padding: '16px 18px',
                fontSize: 18, color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)', fontWeight: 600,
                outline: 'none',
              }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
              Optional — skip if you'd rather not share
            </p>
          </div>
        )}

        {/* Step 2 — Mode */}
        {step === 2 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Set your intent for tonight. You can change this anytime.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 18px', borderRadius: 16,
                    border: mode === m.value
                      ? `1.5px solid ${m.color}`
                      : '1.5px solid var(--border)',
                    background: mode === m.value
                      ? `${m.color}14`
                      : 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 28 }}>{m.emoji}</span>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
                      color: mode === m.value ? m.color : 'var(--text-primary)',
                    }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {m.sub}
                    </div>
                  </div>
                  {mode === m.value && (
                    <div style={{ marginLeft: 'auto', color: m.color, fontSize: 18 }}>✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Instagram */}
        {step === 3 && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              When someone connects with you and you both accept, you'll see each other's Instagram handles.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Your handle is never shown publicly — only on mutual connection.
            </p>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
                fontSize: 18, color: 'var(--text-muted)',
              }}>@</span>
              <input
                autoFocus
                type="text"
                value={instagram}
                onChange={e => setInstagram(e.target.value.replace(/[@\s]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && nextStep()}
                placeholder="yourhandle"
                maxLength={30}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg-card)',
                  border: '1.5px solid var(--border-active)',
                  borderRadius: 14, padding: '16px 18px 16px 40px',
                  fontSize: 18, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)', fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
              Optional — you can add this later in your profile settings
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{
          fontSize: 13, color: '#FF3B5C',
          textAlign: 'center', padding: '0 24px', marginTop: 12,
        }}>
          {error}
        </p>
      )}

      {/* Bottom CTA */}
      <div style={{ padding: '0 24px', marginTop: 32 }}>
        <button
          className="btn-primary"
          onClick={nextStep}
          disabled={saving}
          style={{ fontSize: 16 }}
        >
          {saving ? 'Setting up...' : step === steps.length - 1 ? 'Start Vibing 🔥' : 'Continue →'}
        </button>

        {step === 3 && (
          <button
            onClick={handleFinish}
            style={{
              width: '100%', marginTop: 12, padding: '14px',
              background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
        )}

        {step > 0 && (
          <button
            onClick={() => { setError(''); setStep(s => s - 1) }}
            style={{
              width: '100%', marginTop: 8, padding: '10px',
              background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
