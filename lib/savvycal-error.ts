import { extractErrorMessage } from './extract-error-message.ts'

export const SLOT_UNAVAILABLE_MESSAGE = 'That time is no longer available — please pick another time.'

// SavvyCal rejects any time that isn't an open slot on the link (conflict,
// scheduling notice, buffers, etc.) with a generic `start_at is invalid`.
export function savvyCalErrorMessage(responseText: string): string {
  try {
    if (JSON.parse(responseText)?.errors?.start_at) return SLOT_UNAVAILABLE_MESSAGE
  } catch {
    // fall through to generic parsing
  }
  return extractErrorMessage(responseText, 'Failed to create booking')
}
