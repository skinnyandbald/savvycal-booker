import { NextRequest, NextResponse } from 'next/server'
import { extractErrorMessage } from '@/lib/extract-error-message'
import { redact } from '@/lib/redact'
import {
  isAllowed,
  isDuration,
  isEmail,
  isIsoTimestamp,
  isName,
  isSafeSegment,
  isTimeZone,
} from '@/lib/validate'

type Provider = 'savvycal' | 'calcom'

interface BookingRequest {
  provider?: Provider
  // SavvyCal fields
  link_id?: string
  // Cal.com fields
  username?: string
  event_slug?: string
  // Common fields
  start_at: string
  duration?: number
  attendee_name: string
  attendee_email: string
  time_zone?: string
}

// SavvyCal booking handler
async function bookSavvyCal(body: BookingRequest): Promise<NextResponse> {
  const SAVVYCAL_TOKEN = process.env.SAVVYCAL_TOKEN

  if (!SAVVYCAL_TOKEN) {
    return NextResponse.json(
      { error: 'Server not configured - missing SAVVYCAL_TOKEN' },
      { status: 500 }
    )
  }

  const { link_id, start_at, attendee_name, attendee_email } = body

  if (!link_id) {
    return NextResponse.json(
      { error: 'Missing required field: link_id' },
      { status: 400 }
    )
  }

  if (!isSafeSegment(link_id) || !isAllowed(link_id, process.env.SAVVYCAL_ALLOWED_LINK_IDS)) {
    return NextResponse.json({ error: 'Invalid link_id' }, { status: 400 })
  }

  // Fetch the link to get its default duration
  const linkResponse = await fetch(`https://api.savvycal.com/v1/links/${encodeURIComponent(link_id)}`, {
    headers: {
      'Authorization': `Bearer ${SAVVYCAL_TOKEN}`,
    },
  })

  if (!linkResponse.ok) {
    console.log('Failed to fetch link:', linkResponse.status)
    return NextResponse.json({ error: 'Failed to fetch link details' }, { status: 500 })
  }

  const linkData = await linkResponse.json()
  console.log('Link data fetched successfully')

  // Get a valid duration - must be one of the link's configured durations
  let validDuration = body.duration || linkData.default_duration
  if (linkData.durations && linkData.durations.length > 0) {
    if (!linkData.durations.includes(validDuration)) {
      console.log(`Duration ${validDuration} not in available durations:`, linkData.durations)
      validDuration = linkData.default_duration || linkData.durations[0]
    }
  }

  console.log('Using duration:', validDuration)

  const startDate = new Date(start_at)
  const endDate = new Date(startDate.getTime() + validDuration * 60 * 1000)

  // Build event payload
  // Note: SavvyCal API only supports scheduler (display_name, email) - no guest support
  const eventPayload = {
    start_at: startDate.toISOString(),
    end_at: endDate.toISOString(),
    duration: validDuration,
    time_zone: body.time_zone || 'America/New_York',
    email: attendee_email,
    display_name: attendee_name,
  }

  // Create event via SavvyCal API
  const response = await fetch(`https://api.savvycal.com/v1/links/${encodeURIComponent(link_id)}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SAVVYCAL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  })

  const responseText = await response.text()
  console.log('SavvyCal create event response:', response.status)

  if (!response.ok) {
    console.error(
      'SavvyCal error body:',
      response.status,
      redact(responseText, [attendee_name, attendee_email]).slice(0, 2000)
    )
    const errorMessage = extractErrorMessage(responseText, 'Failed to create booking')
    return NextResponse.json({ error: errorMessage }, { status: response.status })
  }

  let event
  try {
    event = JSON.parse(responseText)
  } catch {
    return NextResponse.json({ error: 'Invalid response from SavvyCal' }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    provider: 'savvycal',
    event_id: event.id,
    start_at: event.start_at,
    end_at: event.end_at,
  })
}

// Fetch Cal.com host name from /v2/me endpoint
async function getCalComHostName(apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.cal.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'cal-api-version': '2024-08-13',
      },
    })
    if (response.ok) {
      const data = await response.json()
      // Handle both { user: { name } } and { data: { name } } formats
      const user = data.user || data.data || data
      return user.name || user.username || 'Host'
    }
  } catch (err) {
    console.error('Failed to fetch Cal.com host name:', err)
  }
  return 'Host'
}

// Cal.com booking handler
async function bookCalCom(body: BookingRequest): Promise<NextResponse> {
  const CALCOM_API_KEY = process.env.CALCOM_API_KEY

  if (!CALCOM_API_KEY) {
    return NextResponse.json(
      { error: 'Server not configured - missing CALCOM_API_KEY' },
      { status: 500 }
    )
  }

  const { username, event_slug, start_at, attendee_name, attendee_email, time_zone } = body

  if (!username || !event_slug) {
    return NextResponse.json(
      { error: 'Missing required fields: username, event_slug' },
      { status: 400 }
    )
  }

  if (
    !isSafeSegment(username) ||
    !isSafeSegment(event_slug) ||
    !isAllowed(username, process.env.CALCOM_ALLOWED_USERNAMES) ||
    !isAllowed(event_slug, process.env.CALCOM_ALLOWED_EVENT_SLUGS)
  ) {
    return NextResponse.json({ error: 'Invalid username or event_slug' }, { status: 400 })
  }

  // Fetch host name for meeting title
  const hostName = await getCalComHostName(CALCOM_API_KEY)

  // Build booking payload - don't send lengthInMinutes, let Cal.com use the event type's default
  // (event types have specific allowed durations that we don't know without fetching the event type)
  // Note: We don't pass location - Cal.com uses the event type's default location.
  // Video conferencing links (Zoom, etc.) are generated by Cal.com based on the event type config.
  const bookingPayload = {
    start: start_at,
    eventTypeSlug: event_slug,
    username: username,
    attendee: {
      name: attendee_name,
      email: attendee_email,
      timeZone: time_zone || 'America/New_York',
    },
    // Include common required booking fields - Cal.com event types often require these
    bookingFieldsResponses: {
      title: `${hostName} <> ${attendee_name} meeting`,
      notes: '',
    },
  }

  // Create booking via Cal.com API v2
  const response = await fetch('https://api.cal.com/v2/bookings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CALCOM_API_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingPayload),
  })

  const responseText = await response.text()
  console.log('Cal.com create booking response:', response.status)

  if (!response.ok) {
    console.error(
      'Cal.com error body:',
      response.status,
      redact(responseText, [attendee_name, attendee_email]).slice(0, 2000)
    )
    // Cal.com v2 API returns errors in format: { status: "error", error: { code: "...", message: "..." } }
    const errorMessage = extractErrorMessage(responseText, 'Failed to create booking')
    return NextResponse.json({ error: errorMessage }, { status: response.status })
  }

  let data
  try {
    data = JSON.parse(responseText)
  } catch {
    return NextResponse.json({ error: 'Invalid response from Cal.com' }, { status: 502 })
  }
  const booking = data.data || data

  return NextResponse.json({
    success: true,
    provider: 'calcom',
    event_id: booking.uid || booking.id,
    start_at: booking.start,
    end_at: booking.end,
  })
}

export async function POST(request: NextRequest) {
  try {
    let body: BookingRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const { provider = 'savvycal', start_at, attendee_name, attendee_email } = body

    // Validate common required fields
    if (!start_at || !attendee_name || !attendee_email) {
      return NextResponse.json(
        { error: 'Missing required fields: start_at, attendee_name, attendee_email' },
        { status: 400 }
      )
    }

    if (provider !== 'savvycal' && provider !== 'calcom') {
      return NextResponse.json({ error: "Invalid provider: must be 'savvycal' or 'calcom'" }, { status: 400 })
    }
    if (!isIsoTimestamp(start_at)) {
      return NextResponse.json({ error: 'Invalid start_at: must be an ISO timestamp' }, { status: 400 })
    }
    if (!isName(attendee_name)) {
      return NextResponse.json({ error: 'Invalid attendee_name' }, { status: 400 })
    }
    if (!isEmail(attendee_email)) {
      return NextResponse.json({ error: 'Invalid attendee_email' }, { status: 400 })
    }
    // != null: the page sends parseInt(), and NaN serializes to null
    if (body.duration != null && !isDuration(body.duration)) {
      return NextResponse.json({ error: 'Invalid duration: must be an integer from 1 to 1440' }, { status: 400 })
    }
    if (body.time_zone != null && !isTimeZone(body.time_zone)) {
      return NextResponse.json({ error: 'Invalid time_zone' }, { status: 400 })
    }

    // Route to appropriate provider
    if (provider === 'calcom') {
      return await bookCalCom(body)
    } else {
      return await bookSavvyCal(body)
    }
  } catch (err) {
    console.error('Booking error:', err instanceof Error ? err.name : typeof err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
