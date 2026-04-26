import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const slides = [
  {
    emoji: '🔥',
    title: 'Know the Vibe\nBefore You Go',
    sub: 'Real-time scores for every bar and club nearby — rated by people who are literally inside right now.',
    color: '#FF6B2B',
    accent: 'rgba(255,107,43,0.12)',
  },
  {
    emoji: '📍',
    title: 'Only Real,\nRight Now Content',
    sub: "Every photo and post is location-locked. No old pics, no staging — just what's actually happening.",
    color: '#00D4FF',
    accent: 'rgba(0,212,255,0.12)',
  },
  {
    emoji: '👥',
    title: 'Meet People\nAt the Venue',
    sub: 'See who else is out tonight. Connect, vibe, and make something happen — no cold approaches required.',
    color: '#8B5CF6',
    accent: 'rgba(139,92,246,0.12)',
  },
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const { setOnboarded } = useApp()
  const [transitioning, setTransitioning] = useState(false)

  const slide = slides[step]

  const goTo = (next) => {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setStep(next)
      setTransitioning(false)
    }, 200)
  }

  const handleNext = () => {
    if (step < slides.length - 1) {
      goTo(step + 1)
    } else {
      setOnboarded(true)
      navigate('/', { replace: true })
    }
  }

  const handleSkip = () => {
    setOnboarded(true)
    navigate('/', { replace: true })
  }

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '52px 28px 48px',
      background: `radial-gradient(ellipse at 50% 15%, ${slide.accent} 0%, transparent 65%)`,
      transition: 'background 0.5s ease',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top row */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          background: 'linear-gradient(90deg, #FF6B2B, #FF3B5C)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Live Vibes
        </span>
        {step < slides.length - 1 && (
          <button onClick={handleSkip} style={{
            background: 'none', border: 'none',
            color: 'var(--text-muted)', fontSize: 14,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            Skip
          </button>
        )}
      </div>

      {/* Hero section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'translateY(10px)' : 'translateY(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        flex: 1,
        justifyContent: 'center',
        gap: 0,
      }}>
        {/* Big emoji */}
        <div style={{
          fontSize: 88,
          marginBottom: 36,
          animation: 'float 3s ease infinite',
          filter: `drop-shadow(0 0 48px ${slide.color}88)`,
          lineHeight: 1,
        }}>
          {slide.emoji}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          fontWeight: 800,
          color: 'var(--text-primary)',
          lineHeight: 1.15,
          marginBottom: 18,
          whiteSpace: 'pre-line',
          letterSpacing: '-0.5px',
        }}>
          {slide.title}
        </h1>

        <p style={{
          fontSize: 16,
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          maxWidth: 300,
        }}>
          {slide.sub}
        </p>
      </div>

      {/* Bottom section */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {/* Dots */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => i < step && goTo(i)}
              style={{
                width: i === step ? 28 : 8,
                height: 8,
                borderRadius: 999,
                background: i === step ? slide.color : i < step ? 'var(--text-muted)' : 'var(--border)',
                transition: 'all 0.35s ease',
                cursor: i < step ? 'pointer' : 'default',
              }}
            />
          ))}
        </div>

        {/* CTA Button */}
        <button
          className="btn-primary"
          onClick={handleNext}
          style={{
            background: `linear-gradient(135deg, ${slide.color}, ${slide.color}BB)`,
            boxShadow: `0 8px 32px ${slide.color}44`,
            fontSize: 16,
            letterSpacing: '0.5px',
          }}
        >
          {step === slides.length - 1 ? 'Find My Vibe →' : 'Next'}
        </button>

        {/* Step indicator */}
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {step + 1} of {slides.length}
        </p>
      </div>
    </div>
  )
}
