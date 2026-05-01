import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { requestPermission } from '../lib/onesignal'

const MODES = [
  { value: 'vibing',      label: 'Just Vibing',   emoji: '😎' },
  { value: 'social',      label: 'Be Social',      emoji: '👋' },
  { value: 'dating',      label: 'Dating',         emoji: '💫' },
  { value: 'networking',  label: 'Networking',     emoji: '🤝' },
]

export default function SignUpModal({ onClose }) {
  const { refreshUser } = useApp()
  const [step, setStep]         = useState('phone')
  const [phone, setPhone]       = useState('')
  const [otp, setOtp]           = useState('')
  const [name, setName]         = useState('')
  const [username, setUsername] = useState('')
  const [age, setAge]           = useState('')
  const [mode, setMode]         = useState('vibing')
  const [instagram, setInstagram] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  async function sendOtp() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) { setError('Enter a valid 10-digit US phone number'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithOtp({ phone: `+1${digits.slice(-10)}` })
    if (err) { setError(err.message); setLoading(false); return }
    setStep('otp'); setLoading(false)
  }

  async function verifyOtp() {
    if (otp.length < 6) { setError('Enter the 6-digit code'); return }
    setLoading(true); setError('')
    const digits = phone.replace(/\D/g, '')
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: `+1${digits.slice(-10)}`, token: otp, type: 'sms',
    })
    if (err) { setError(err.message); setLoading(false); return }
    if (data.user) {
      const { data: existing } = await supabase
        .from('users').select('profile_complete').eq('id', data.user.id).single()
      if (existing?.profile_complete) { onClose(); return }
    }
    setStep('profile1'); setLoading(false)
  }

  async function saveProfile() {
    const ageNum = parseInt(age)
    if (!name.trim()) { setError('Enter your name'); return }
    if (!username.trim()) { setError('Choose a username'); return }
    if (!age || ageNum < 18 || ageNum > 99) { setError('Enter a valid age (18+)'); return }
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session error — please try again'); setLoading(false); return }
    await supabase.auth.updateUser({ data: { name: name.trim() } })
    const { error: err } = await supabase.from('users').upsert({
      id: user.id,
      name: name.trim(),
      handle: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      age: ageNum,
      mode,
      instagram_handle: instagram.trim() || null,
      profile_complete: true,
      visible: true,
    })
    if (err) { setError(err.message); setLoading(false); return }
    await refreshUser()
    requestPermission()
    onClose()
  }

  const stepDots = ['phone', 'otp', 'profile1', 'profile2']
  const dotIndex = stepDots.indexOf(step)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px', overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg-card)', borderRadius: 24,
        padding: '28px 24px 36px', border: '1px solid var(--border)',
        position: 'relative', animation: 'lv-slide-up 0.25s ease', margin: 'auto',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1,
          }}
        >×</button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
            background: 'linear-gradient(90deg, #FF6B2B, #FF3B5C)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Live Vibes</span>
        </div>

        {/* Progress dots */}
        {dotIndex >= 0 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
            {stepDots.map((_, i) => (
              <div key={i} style={{
                width: i === dotIndex ? 20 : 6, height: 6, borderRadius: 999,
                background: i <= dotIndex ? '#FF6B2B' : 'var(--border)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        )}

        {/* ── PHONE ── */}
        {step === 'phone' && (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Join the vibe 🔥
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              See live scores, who&apos;s here &amp; more. No password needed.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{
                padding: '14px 14px', borderRadius: '14px 0 0 14px',
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRight: 'none', color: 'var(--text-secondary)', fontSize: 14, whiteSpace: 'nowrap',
              }}>🇺🇸 +1</div>
              <input
                className="input-field"
                style={{ borderRadius: '0 14px 14px 0', borderLeft: 'none' }}
                placeholder="(215) 555-0100"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                inputMode="tel" maxLength={14} autoFocus
              />
            </div>
            {error && <p style={{ color: '#FF3B5C', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button className="btn-primary" onClick={sendOtp} disabled={loading}>
              {loading ? 'Sending...' : 'Send Code →'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14 }}>
              By joining you agree to our Terms &amp; Privacy Policy
            </p>
          </>
        )}

        {/* ── OTP ── */}
        {step === 'otp' && (
          <>
            <button
              onClick={() => { setStep('phone'); setOtp(''); setError('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}
            >← Back</button>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Enter the code
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Sent to {phone}</p>
            <input
              className="input-field"
              style={{ textAlign: 'center', fontSize: 22, letterSpacing: '8px', fontFamily: 'var(--font-display)', marginBottom: 12 }}
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              inputMode="numeric" maxLength={6} autoFocus
            />
            {error && <p style={{ color: '#FF3B5C', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button className="btn-primary" onClick={verifyOtp} disabled={loading || otp.length < 6}>
              {loading ? 'Verifying...' : 'Verify →'}
            </button>
            <p
              style={{ fontSize: 13, color: 'var(--accent-cyan)', textAlign: 'center', marginTop: 14, cursor: 'pointer' }}
              onClick={() => { setStep('phone'); setOtp('') }}
            >Resend code</p>
          </>
        )}

        {/* ── PROFILE STEP 1: name, username, age ── */}
        {step === 'profile1' && (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Who are you? 👋
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              This is how you appear to others at venues.
            </p>
            <input
              className="input-field"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ marginBottom: 10 }}
              autoFocus
            />
            <input
              className="input-field"
              placeholder="Username (e.g. nightowl)"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              style={{ marginBottom: 10 }}
            />
            <input
              className="input-field"
              placeholder="Age"
              value={age}
              onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 2))}
              inputMode="numeric"
              maxLength={2}
              style={{ marginBottom: 6 }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>Must be 18+</p>
            {error && <p style={{ color: '#FF3B5C', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button
              className="btn-primary"
              onClick={() => {
                if (!name.trim()) { setError('Enter your name'); return }
                if (!username.trim()) { setError('Choose a username'); return }
                const ageNum = parseInt(age)
                if (!age || ageNum < 18 || ageNum > 99) { setError('Enter a valid age (18+)'); return }
                setError('')
                setStep('profile2')
              }}
              disabled={!name.trim() || !username.trim() || !age}
            >
              Continue →
            </button>
          </>
        )}

        {/* ── PROFILE STEP 2: vibe mode + instagram ── */}
        {step === 'profile2' && (
          <>
            <button
              onClick={() => { setStep('profile1'); setError('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}
            >← Back</button>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              What&apos;s your vibe? ✨
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
              Helps others know why you&apos;re out tonight.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  style={{
                    padding: '12px 10px', borderRadius: 14, textAlign: 'center',
                    border: mode === m.value ? '1.5px solid #FF6B2B' : '1.5px solid var(--border)',
                    background: mode === m.value ? 'rgba(255,107,43,0.12)' : 'var(--bg-primary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{m.emoji}</div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)',
                    color: mode === m.value ? '#FF6B2B' : 'var(--text-secondary)',
                  }}>{m.label}</div>
                </button>
              ))}
            </div>

            <input
              className="input-field"
              placeholder="Instagram or social (optional)"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              style={{ marginBottom: 6 }}
            />
            <p style={{ fontSize: 11, color: 'var(--accent-cyan)', marginBottom: 20 }}>
              ✨ Recommended — lets people connect with you at venues
            </p>
            {error && <p style={{ color: '#FF3B5C', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button className="btn-primary" onClick={saveProfile} disabled={loading}>
              {loading ? 'Setting up...' : "Let's Go 🔥"}
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes lv-slide-up {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
