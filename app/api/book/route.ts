import { NextRequest, NextResponse } from 'next/server'

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

function extractErrorMessage(responseText: string, defaultMessage: string): string {
  try {
    const errorData = JSON.parse(responseText)
    return errorData.message || errorData.error || defaultMessage
  } catch {
    return responseText || defaultMessage
  }
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

  // Fetch the link to get its default duration
  const linkResponse = await fetch(`https://api.savvycal.com/v1/links/${link_id}`, {
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

  // Create event via SavvyCal API
  const response = await fetch(`https://api.savvycal.com/v1/links/${link_id}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SAVVYCAL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      duration: validDuration,
      time_zone: body.time_zone || 'America/New_York',
      email: attendee_email,
      display_name: attendee_name,
    }),
  })

  const responseText = await response.text()
  console.log('SavvyCal create event response:', response.status)

  if (!response.ok) {
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

  const duration = body.duration || 30

  // Create booking via Cal.com API v2
  const response = await fetch('https://api.cal.com/v2/bookings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CALCOM_API_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start: start_at,
      eventTypeSlug: event_slug,
      username: username,
      attendee: {
        name: attendee_name,
        email: attendee_email,
        timeZone: time_zone || 'America/New_York',
      },
      lengthInMinutes: duration,
    }),
  })

  const responseText = await response.text()
  console.log('Cal.com create booking response:', response.status)

  if (!response.ok) {
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
    const body: BookingRequest = await request.json()
    const { provider = 'savvycal', start_at, attendee_name, attendee_email } = body

    // Validate common required fields
    if (!start_at || !attendee_name || !attendee_email) {
      return NextResponse.json(
        { error: 'Missing required fields: start_at, attendee_name, attendee_email' },
        { status: 400 }
      )
    }

    // Route to appropriate provider
    if (provider === 'calcom') {
      return await bookCalCom(body)
    } else {
      return await bookSavvyCal(body)
    }
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
