'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function BookingForm() {
  const searchParams = useSearchParams()
  const slot = searchParams.get('slot') // ISO timestamp
  const linkId = searchParams.get('link_id') // SavvyCal link ID
  const duration = searchParams.get('duration') || '30'
  const tz = searchParams.get('tz') || 'America/New_York'
  const hostName = searchParams.get('host') || 'Ben Fisher'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!slot || !linkId) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Missing Parameters</h1>
          <p style={{ color: '#666' }}>Required: slot, link_id</p>
        </div>
      </div>
    )
  }

  const slotDate = new Date(slot)
  const endDate = new Date(slotDate.getTime() + parseInt(duration) * 60 * 1000)

  const formattedDate = slotDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: tz
  })

  const formattedStartTime = slotDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: tz
  }).toLowerCase()

  const formattedEndTime = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: tz
  }).toLowerCase()

  // Get timezone abbreviation
  const tzAbbr = slotDate.toLocaleTimeString('en-US', {
    timeZone: tz,
    timeZoneName: 'short'
  }).split(' ').pop()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_id: linkId,
          start_at: slot,
          duration: parseInt(duration),
          attendee_name: name,
          attendee_email: email,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to book')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successHeader}>
            <div style={styles.successIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h1 style={styles.confirmTitle}>You&apos;re scheduled!</h1>
          </div>

          <div style={styles.detailRow}>
            <svg style={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div>
              <div style={styles.dateText}>{formattedDate}</div>
              <div style={styles.timeText}>{formattedStartTime} – {formattedEndTime} ({tzAbbr})</div>
            </div>
          </div>

          <p style={styles.confirmMessage}>
            A calendar invitation has been sent to <strong>{email}</strong>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.pinkCircle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <h1 style={styles.confirmTitle}>Confirm your details</h1>
          </div>
        </div>

        <div style={styles.detailRow}>
          <svg style={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <div style={styles.durationPills}>
            <div style={styles.durationPillActive}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="12" r="10" fill="#3b82f6"/>
                <polyline points="9 12 11 14 15 10" fill="none" stroke="white" strokeWidth="2"/>
              </svg>
              <span>{duration} min</span>
            </div>
          </div>
        </div>

        <div style={styles.detailRow}>
          <svg style={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <div>
            <div style={styles.dateText}>{formattedDate}</div>
            <div style={styles.timeText}>{formattedStartTime} – {formattedEndTime} ({tzAbbr})</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Your Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Your Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button type="button" style={styles.addGuestButton}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            <span>Add a guest</span>
          </button>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.footer}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.scheduleButton,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div style={styles.container}>
        <div style={styles.card}>Loading...</div>
      </div>
    }>
      <BookingForm />
    </Suspense>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pinkCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#ec4899',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#111',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '20px',
  },
  icon: {
    flexShrink: 0,
    marginTop: '2px',
  },
  durationPills: {
    display: 'flex',
    gap: '8px',
  },
  durationPillActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: '#eff6ff',
    border: '2px solid #3b82f6',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1e40af',
  },
  dateText: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#111',
  },
  timeText: {
    fontSize: '15px',
    color: '#111',
    marginTop: '2px',
  },
  form: {
    marginTop: '8px',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  scheduleButton: {
    padding: '12px 24px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#fce7f3',
    color: '#be185d',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  addGuestButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '20px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  error: {
    color: '#dc2626',
    fontSize: '14px',
    padding: '12px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  successHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  successIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmMessage: {
    color: '#666',
    fontSize: '15px',
    lineHeight: 1.6,
    marginTop: '24px',
  },
}
