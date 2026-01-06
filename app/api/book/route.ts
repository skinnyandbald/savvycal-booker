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
    const { link_id, start_at, duration, attendee_name, attendee_email } = body

    if (!link_id || !start_at || !attendee_name || !attendee_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate end time based on duration
    const startDate = new Date(start_at)
    const endDate = new Date(startDate.getTime() + (duration || 30) * 60 * 1000)

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
        attendees: [
          {
            email: attendee_email,
            name: attendee_name,
            is_organizer: false,
          }
        ],
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
