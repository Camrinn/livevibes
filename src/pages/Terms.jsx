import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Terms() {
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
          Terms of Service
        </h1>
      </div>

      <div style={{ padding: '28px 24px', maxWidth: 600, margin: '0 auto', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 28 }}>Last updated: May 2026</p>

        <Section title="1. Acceptance">
          By using Live Vibes you agree to these terms. If you don't agree, don't use the app.
        </Section>

        <Section title="2. Eligibility">
          You must be 21 or older to use Live Vibes. By creating an account you confirm you meet this requirement.
        </Section>

        <Section title="3. Your Account">
          You're responsible for keeping your account secure. Don't share your login or use someone else's account. We can suspend or delete accounts that violate these terms.
        </Section>

        <Section title="4. Acceptable Use">
          Don't use Live Vibes to post illegal content, harass other users, spam venues, or impersonate people. We reserve the right to remove content and ban users who violate this.
        </Section>

        <Section title="5. Check-ins & Location">
          Check-in features use your device location to verify you're near a venue. Location data is not stored permanently. You can disable location at any time in your device settings.
        </Section>

        <Section title="6. User Content">
          You own the content you post. By posting, you give us a license to display it within the app. We're not responsible for content posted by other users.
        </Section>

        <Section title="7. Venue Information">
          Venue details (hours, vibe scores, crowd counts) are user-generated and may not be accurate. Always verify with the venue directly.
        </Section>

        <Section title="8. Disclaimers">
          Live Vibes is provided as-is. We're not responsible for anything that happens at venues you discover through the app. Go out safely and drink responsibly.
        </Section>

        <Section title="9. Changes">
          We may update these terms. Continued use of the app means you accept the updated terms.
        </Section>

        <Section title="10. Contact">
          Questions? Reach us at support@vibars.com
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
      <p style={{ margin: 0 }}>{children}</p>
    </div>
  )
}
