import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', padding: '0 0 60px' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)',
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 14 }}
        >
          ← Back
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Privacy Policy
        </h1>
      </div>

      <div style={{ padding: '28px 24px', maxWidth: 600, margin: '0 auto', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 28 }}>Last updated: May 2026</p>

        <Section title="What We Collect">
          <ul style={{ margin: '0', paddingLeft: 20 }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>Phone number or email</strong> — used to create and verify your account</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Profile info</strong> — name, username, bio, Instagram handle (all optional except name)</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Location</strong> — only when you check in, to verify you're near a venue. Not stored permanently.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Posts & activity</strong> — content you post, venues you check into, vibe votes</li>
          </ul>
        </Section>

        <Section title="What We Don't Collect">
          We don't sell your data. We don't run ads. We don't track your location in the background. We don't share your info with third parties except the services needed to run the app (Supabase for the database, Google for venue search).
        </Section>

        <Section title="How We Use It">
          Your data is used to run the app — showing who's at a venue, calculating vibe scores, sending notifications you've opted into, and preventing spam. That's it.
        </Section>

        <Section title="Visibility Settings">
          You control whether you appear in "Who's Here" at venues. Toggle visibility off in your profile at any time and you'll disappear from all venue check-in lists immediately.
        </Section>

        <Section title="Push Notifications">
          If you enable push notifications, we use OneSignal to deliver them. You can disable them at any time in your profile or device settings.
        </Section>

        <Section title="Data Deletion">
          You can delete your account from your profile settings. This removes your personal data from our database. Some activity (like posts at venues) may be retained in anonymized form.
        </Section>

        <Section title="Security">
          We use Supabase with row-level security to ensure users can only access data they're supposed to see. All connections are encrypted via HTTPS.
        </Section>

        <Section title="Contact">
          Questions about your data? Email us at support@vibars.com
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title}
      </h2>
      <div style={{ margin: 0 }}>{children}</div>
    </div>
  )
}
