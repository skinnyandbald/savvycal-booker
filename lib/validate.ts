const SAFE_SEGMENT = /^[A-Za-z0-9_-]{1,100}$/
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// A value that's safe to interpolate as a single URL path segment.
export function isSafeSegment(value: unknown): value is string {
  return typeof value === 'string' && SAFE_SEGMENT.test(value)
}

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_SHAPE.test(value)
}

export function isName(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 200 && value.trim().length > 0
}

export function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value))
}

// Duration in minutes: an integer between 1 and 1440 (one day).
export function isDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 1440
}

export function isTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

// Checks value against a comma-separated allow-list. Unset or empty list allows anything.
export function isAllowed(value: string, allowListEnv: string | undefined): boolean {
  const allowed = (allowListEnv ?? '').split(',').map((v) => v.trim()).filter(Boolean)
  return allowed.length === 0 || allowed.includes(value)
}
