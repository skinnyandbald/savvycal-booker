import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const SAVVYCAL_TOKEN = process.env.SAVVYCAL_TOKEN

  if (!SAVVYCAL_TOKEN) {
    return NextResponse.json(
      { error: 'Server not configured - missing SAVVYCAL_TOKEN' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { link_id, start_at, attendee_name, attendee_email } = body

    if (!link_id || !start_at || !attendee_name || !attendee_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    console.log('Link data:', JSON.stringify(linkData, null, 2))

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

    // Create event via SavvyCal API
    const response = await fetch(`https://api.savvycal.com/v1/links/${link_id}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SAVVYCAL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_at: startDate.toISOString(),
        duration: validDuration,
        time_zone: body.time_zone || 'America/New_York',
        email: attendee_email,
        display_name: attendee_name,
      }),
    })

    const responseText = await response.text()
    console.log('SavvyCal create event response:', response.status, responseText)

    if (!response.ok) {
      let errorMessage = 'Failed to create booking'
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage = responseText || errorMessage
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const event = JSON.parse(responseText)

    return NextResponse.json({
      success: true,
      event_id: event.id,
      start_at: event.start_at,
      end_at: event.end_at,
    })
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
