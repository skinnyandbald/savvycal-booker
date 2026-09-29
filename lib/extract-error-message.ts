// Returns the value only if it's a non-blank string.
function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

// Pulls a message out of a string or { message } item.
function itemMessage(item: unknown): string | undefined {
  return str(item) ?? str((item as { message?: unknown } | null)?.message)
}

function itemMessages(items: unknown[]): string[] {
  return items.map(itemMessage).filter((m): m is string => m !== undefined)
}

// Flatten a validation `errors` payload into a readable string.
// Handles { field: ['msg', ...] }, { field: 'msg' }, and ['msg' | { message }] shapes.
function formatErrors(errors: unknown): string | undefined {
  if (typeof errors === 'string') return str(errors)
  let parts: string[] = []
  if (Array.isArray(errors)) {
    parts = itemMessages(errors)
  } else if (errors && typeof errors === 'object') {
    parts = Object.entries(errors).flatMap(([field, value]) => {
      if (Array.isArray(value)) return itemMessages(value).map((msg) => `${field} ${msg}`)
      const msg = str(value)
      if (msg === undefined) return []
      return field === 'detail' ? [msg] : [`${field} ${msg}`]
    })
  }
  return parts.length > 0 ? parts.join('; ') : undefined
}

export function extractErrorMessage(responseText: string, defaultMessage: string): string {
  let errorData: unknown
  try {
    errorData = JSON.parse(responseText)
  } catch {
    return responseText || defaultMessage
  }
  if (typeof errorData === 'string') return str(errorData) ?? defaultMessage
  if (!errorData || typeof errorData !== 'object') return defaultMessage

  const data = errorData as { message?: unknown; error?: unknown; errors?: unknown }
  return str(data.message) ?? itemMessage(data.error) ?? formatErrors(data.errors) ?? defaultMessage
}
