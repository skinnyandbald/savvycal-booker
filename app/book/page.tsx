'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type Provider = 'savvycal' | 'calcom'

// Parse alternative slots from comma-separated unix timestamps
function parseAltSlots(altSlotsParam: string | null): Date[] {
  if (!altSlotsParam) return []
  return altSlotsParam
    .split(',')
    .map((ts) => new Date(parseInt(ts, 10) * 1000))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())
}

function BookingForm() {
  const searchParams = useSearchParams()

  // Common params
  const provider: Provider = searchParams.get('provider') === 'calcom' ? 'calcom' : 'savvycal'
  const initialSlot = searchParams.get('slot') // ISO timestamp
  const duration = searchParams.get('duration') || '30'
  const tz = searchParams.get('tz') || 'America/New_York'
  const altSlotsParam = searchParams.get('alt_slots')

  // SavvyCal params
  const linkId = searchParams.get('link_id')

  // Cal.com params
  const calcomUsername = searchParams.get('username')
  const calcomEventSlug = searchParams.get('event_slug')

  // Parse alternative slots for dropdown
  const availableSlots = useMemo(() => {
    const altSlots = parseAltSlots(altSlotsParam)
    // If we have alt_slots, use them; otherwise just use the initial slot
    if (altSlots.length > 0) return altSlots
    if (initialSlot) return [new Date(initialSlot)]
    return []
  }, [altSlotsParam, initialSlot])

  // Track selected slot (defaults to the one from URL)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0)

  // Find the index of the initial slot in availableSlots
  useEffect(() => {
    if (initialSlot && availableSlots.length > 0) {
      const initialTime = new Date(initialSlot).getTime()
      const idx = availableSlots.findIndex((s) => s.getTime() === initialTime)
      if (idx !== -1) setSelectedSlotIndex(idx)
    }
  }, [initialSlot, availableSlots])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [guests, setGuests] = useState<string[]>([])
  const [showGuestInput, setShowGuestInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Current selected slot
  const slot = availableSlots[selectedSlotIndex]?.toISOString() || initialSlot

  // Validate required params based on provider
  const isSavvyCal = provider === 'savvycal'
  const isCalCom = provider === 'calcom'

  const missingParams = !initialSlot || (isSavvyCal && !linkId) || (isCalCom && (!calcomUsername || !calcomEventSlug))

  if (missingParams) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Missing Parameters</h1>
          <p style={{ color: '#666' }}>
            {isSavvyCal && 'Required: slot, link_id'}
            {isCalCom && 'Required: slot, username, event_slug'}
          </p>
        </div>
      </div>
    )
  }

  const slotDate = new Date(slot!)
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

  const addGuest = () => {
    setGuests([...guests, ''])
    setShowGuestInput(true)
  }

  const updateGuest = (index: number, value: string) => {
    const newGuests = [...guests]
    newGuests[index] = value
    setGuests(newGuests)
  }

  const removeGuest = (index: number) => {
    const newGuests = guests.filter((_, i) => i !== index)
    setGuests(newGuests)
    if (newGuests.length === 0) {
      setShowGuestInput(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Filter out empty guest emails
      const validGuests = guests.filter(g => g.trim() !== '')

      // Build request body based on provider
      const requestBody: Record<string, unknown> = {
        provider,
        start_at: slot,
        duration: parseInt(duration),
        attendee_name: name,
        attendee_email: email,
        time_zone: tz,
        guests: validGuests,
      }

      if (isSavvyCal) {
        requestBody.link_id = linkId
      } else if (isCalCom) {
        requestBody.username = calcomUsername
        requestBody.event_slug = calcomEventSlug
      }

      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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

  // Provider-specific colors
  const accentColor = isCalCom ? '#292929' : '#ec4899'
  const buttonBgColor = isCalCom ? '#f0f0f0' : '#fce7f3'
  const buttonTextColor = isCalCom ? '#292929' : '#be185d'
  const buttonHoverBgColor = isCalCom ? '#e0e0e0' : '#fbcfe8'

  // Cmd+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        const form = document.querySelector('form')
        if (form) {
          form.requestSubmit()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Inject hover styles
  const hoverStyles = `
    .schedule-btn {
      transition: background-color 0.15s ease, transform 0.1s ease;
    }
    .schedule-btn:hover:not(:disabled) {
      background-color: ${buttonHoverBgColor} !important;
      transform: translateY(-1px);
    }
    .schedule-btn:active:not(:disabled) {
      transform: translateY(0);
    }
  `

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successHeader}>
            <div style={{ ...styles.successIcon }}>
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
      <style>{hoverStyles}</style>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={{ ...styles.pinkCircle, backgroundColor: accentColor }}>
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
          <div style={{ flex: 1 }}>
            <div style={styles.dateText}>{formattedDate}</div>
            {availableSlots.length > 1 ? (
              <select
                value={selectedSlotIndex}
                onChange={(e) => setSelectedSlotIndex(parseInt(e.target.value, 10))}
                style={styles.timeSelect}
              >
                {availableSlots.map((slotOption, idx) => {
                  const startTime = slotOption.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: tz
                  }).toLowerCase()
                  const endTime = new Date(slotOption.getTime() + parseInt(duration) * 60 * 1000)
                    .toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: tz
                    }).toLowerCase()
                  return (
                    <option key={idx} value={idx}>
                      {startTime} – {endTime} ({tzAbbr})
                    </option>
                  )
                })}
              </select>
            ) : (
              <div style={styles.timeText}>{formattedStartTime} – {formattedEndTime} ({tzAbbr})</div>
            )}
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

          {showGuestInput && guests.map((guest, index) => (
            <div key={index} style={styles.guestRow}>
              <input
                type="email"
                value={guest}
                onChange={(e) => updateGuest(index, e.target.value)}
                placeholder="guest@example.com"
                style={styles.guestInput}
              />
              <button
                type="button"
                onClick={() => removeGuest(index)}
                style={styles.removeGuestButton}
                aria-label="Remove guest"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}

          <button type="button" onClick={addGuest} style={styles.addGuestButton}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            <span>{guests.length > 0 ? 'Add another guest' : 'Add a guest'}</span>
          </button>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.footer}>
            <button
              type="submit"
              disabled={loading}
              className="schedule-btn"
              style={{
                ...styles.scheduleButton,
                backgroundColor: buttonBgColor,
                color: buttonTextColor,
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
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#111',
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
  timeSelect: {
    fontSize: '15px',
    color: '#111',
    marginTop: '4px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    width: '100%',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 10px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '20px',
    paddingRight: '36px',
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
  guestRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  guestInput: {
    flex: 1,
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  removeGuestButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    cursor: 'pointer',
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
