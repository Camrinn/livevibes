import React from 'react'

const MAX_SCORE = 175

export function getVibeLabel(score) {
  if (score >= 151) return { label: 'LIT 🔥', short: 'LIT', color: '#FF6B2B', bg: 'rgba(255,107,43,0.15)' }
  if (score >= 101) return { label: 'VIBING 😎', short: 'VIBE', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' }
  if (score >= 51) return { label: 'MID 😐', short: 'MID', color: '#00D4FF', bg: 'rgba(0,212,255,0.15)' }
  return { label: 'DEAD 💀', short: 'DEAD', color: '#44445A', bg: 'rgba(68,68,90,0.15)' }
}

export function getVibeBadgeClass(score) {
  if (score >= 151) return 'badge-lit'
  if (score >= 101) return 'badge-vibing'
  if (score >= 51) return 'badge-mid'
  return 'badge-dead'
}

export default function VibeScore({ score, size = 'md' }) {
  const pct = score / MAX_SCORE
  const { label, color } = getVibeLabel(score)

  const sizes = {
    sm: { r: 28, stroke: 5, fontSize: 13, labelSize: 9, total: 64 },
    md: { r: 42, stroke: 7, fontSize: 20, labelSize: 10, total: 96 },
    lg: { r: 60, stroke: 9, fontSize: 28, labelSize: 12, total: 136 },
  }

  const s = sizes[size]
  const circumference = 2 * Math.PI * s.r
  const dash = circumference * 0.75
  const gap = circumference * 0.25
  const offset = dash - pct * dash

  // Short label for display in circle
  const displayLabel = size === 'sm'
    ? getVibeLabel(score).short
    : label

  return (
    <div style={{
      position: 'relative',
      width: s.total,
      height: s.total,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg
        width={s.total}
        height={s.total}
        viewBox={`0 0 ${s.total} ${s.total}`}
        style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(135deg)' }}
      >
        {/* Track */}
        <circle
          cx={s.total / 2}
          cy={s.total / 2}
          r={s.r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={s.stroke}
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
        />
        {/* Fill */}
        <circle
          cx={s.total / 2}
          cy={s.total / 2}
          r={s.r}
          fill="none"
          stroke={color}
          strokeWidth={s.stroke}
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease',
          }}
        />
      </svg>
      {/* Score text */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: s.fontSize,
          fontWeight: 800,
          color,
          lineHeight: 1,
          letterSpacing: '-1px',
        }}>
          {score}
        </span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: s.labelSize,
          fontWeight: 700,
          color,
          letterSpacing: size === 'sm' ? '0.5px' : '1px',
          marginTop: 2,
          opacity: 0.9,
        }}>
          {size === 'sm' ? getVibeLabel(score).short : label}
        </span>
      </div>
    </div>
  )
}
