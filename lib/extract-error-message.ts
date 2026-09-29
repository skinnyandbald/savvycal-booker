// Returns the value only if it's a non-blank string.
function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

// Pulls a message out of a string or { message } item.
function itemMessage(item: unknown): string | undefined {
  return str(item) ?? str((item as { message?: unknown } | null)?.message)
}

// Flatten a validation `errors` payload into a readable string.
// Handles { field: ['msg', ...] }, { field: 'msg' }, and ['msg' | { message }] shapes.
function formatErrors(errors: unknown): string | undefined {
  if (typeof errors === 'string') return str(errors)
  if (Array.isArray(errors)) {
    const parts = errors.map(itemMessage).filter((m): m is string => m !== undefined)
    return parts.length > 0 ? parts.join('; ') : undefined
  }
  if (errors && typeof errors === 'object') {
    const parts = Object.entries(errors).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value
          .map(itemMessage)
          .filter((m): m is string => m !== undefined)
          .map((msg) => `${field} ${msg}`)
      }
      if (typeof value === 'string') return field === 'detail' ? [value] : [`${field} ${value}`]
      return []
    })
    return parts.length > 0 ? parts.join('; ') : undefined
  }
  return undefined
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
  return (
    str(data.message) ??
    str(data.error) ??
    str((data.error as { message?: unknown } | null)?.message) ??
    formatErrors(data.errors) ??
    defaultMessage
  )
}
