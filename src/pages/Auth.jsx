import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [step, setStep]     = useState('phone') // phone | otp | profile
  const [phone, setPhone]   = useState('')
  const [otp, setOtp]       = useState('')
  const [name, setName]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`
  }

  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) { setError('Enter a valid phone number'); return }
    setLoading(true)
    setError('')
    const e164 = `+1${digits.slice(-10)}`
    const { error: err } = await supabase.auth.signInWithOtp({ phone: e164 })
    if (err) { setError(err.message); setLoading(false); return }
    setStep('otp')
    setLoading(false)
  }

  const handleOtpSubmit = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit code'); return }
    setLoading(true)
    setError('')
    const digits = phone.replace(/\D/g, '')
    const e164 = `+1${digits.slice(-10)}`
    const { data, error: err } = await supabase.auth.verifyOtp({ phone: e164, token: otp, type: 'sms' })
    if (err) { setError(err.message); setLoading(false); return }
    // If new user, go to profile setup
    const isNew = !data.user?.user_metadata?.name
    if (isNew) { setStep('profile'); setLoading(false); return }
    // Existing user — AppContext listener will pick up the session
    setLoading(false)
  }

  const handleProfileSubmit = async () => {
    if (!name.trim()) { setError('Enter your name'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ data: { name: name.trim() } })
    if (err) { setError(err.message); setLoading(false); return }
    // Update the users table too
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('users').update({ name: name.trim() }).eq('id', user.id)
    setLoading(false)
    // AppContext will pick up the session and redirect
  }

  return (
    <div style={{
      height: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 28px',
      background: 'radial-gradient(ellipse at 50% 10%, rgba(255,107,43,0.1) 0%, transparent 60%)',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800,
          background: 'linear-gradient(90deg, #FF6B2B, #FF3B5C)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Live Vibes
        </span>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
          Know the vibe before you go
        </p>
      </div>

      {/* PHONE STEP */}
      {step === 'phone' && (
        <div style={{ width: '100%' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
            color: 'var(--text-primary)', marginBottom: 8,
          }}>
            Enter your number
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
            We'll text you a code. No password needed.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              padding: '14px 14px', borderRadius: '14px 0 0 14px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRight: 'none', color: 'var(--text-secondary)', fontSize: 15,
              whiteSpace: 'nowrap',
            }}>
              🇺🇸 +1
            </div>
            <input
              className="input-field"
              style={{ borderRadius: '0 14px 14px 0', borderLeft: 'none' }}
              placeholder="(215) 555-0100"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()}
              inputMode="tel"
              maxLength={14}
            />
          </div>
          {error && <p style={{ color: '#FF3B5C', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn-primary" onClick={handlePhoneSubmit} disabled={loading}>
            {loading ? 'Sending...' : 'Send Code →'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
            By continuing you agree to our Terms & Privacy Policy
          </p>
        </div>
      )}

      {/* OTP STEP */}
      {step === 'otp' && (
        <div style={{ width: '100%' }}>
          <button
            onClick={() => setStep('phone')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Back
          </button>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
            color: 'var(--text-primary)', marginBottom: 8,
          }}>
            Enter the code
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
            Sent to {phone}
          </p>
          <input
            className="input-field"
            style={{ textAlign: 'center', fontSize: 24, letterSpacing: '8px', fontFamily: 'var(--font-display)', marginBottom: 12 }}
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handleOtpSubmit()}
            inputMode="numeric"
            maxLength={6}
          />
          {error && <p style={{ color: '#FF3B5C', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn-primary" onClick={handleOtpSubmit} disabled={loading || otp.length < 6}>
            {loading ? 'Verifying...' : 'Verify →'}
          </button>
          <p
            style={{ fontSize: 13, color: 'var(--accent-cyan)', textAlign: 'center', marginTop: 16, cursor: 'pointer' }}
            onClick={() => { setStep('phone'); setOtp('') }}
          >
            Resend code
          </p>
        </div>
      )}

      {/* PROFILE STEP */}
      {step === 'profile' && (
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 20 }}>👋</div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
            color: 'var(--text-primary)', marginBottom: 8, textAlign: 'center',
          }}>
            What's your name?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>
            This is how you'll appear to others at venues
          </p>
          <input
            className="input-field"
            placeholder="Your first name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleProfileSubmit()}
            style={{ marginBottom: 12 }}
          />
          {error && <p style={{ color: '#FF3B5C', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn-primary" onClick={handleProfileSubmit} disabled={loading || !name.trim()}>
            {loading ? 'Setting up...' : "Let's Go 🔥"}
          </button>
        </div>
      )}
    </div>
  )
}
