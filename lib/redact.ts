const EMAIL_PATTERN = /[^\s"'<>@]+@[^\s"'<>@]+\.[^\s"'<>@]+/g

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Strip submitted values and any email addresses from text before it's logged.
export function redact(text: string, values: string[]): string {
  let result = text.replace(EMAIL_PATTERN, '[redacted]')
  for (const value of values) {
    if (!value.trim()) continue
    result = result.replace(new RegExp(escapeRegExp(value), 'gi'), '[redacted]')
  }
  return result
}
