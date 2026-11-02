const EMAIL_PATTERN = /[^\s"'<>@]+@[^\s"'<>@]+\.[^\s"'<>@]+/g

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// The forms a value can take inside a JSON response body: raw, JSON-escaped
// (quotes, backslashes, control chars), and JSON-escaped with non-ASCII as \uXXXX.
function encodedForms(value: string): string[] {
  const json = JSON.stringify(value).slice(1, -1)
  const ascii = json.replace(/[\u0080-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
  return [value, json, ascii].filter((form, i, forms) => forms.indexOf(form) === i)
}

// Strip submitted values and any email addresses from text before it's logged.
export function redact(text: string, values: string[]): string {
  let result = text.replace(EMAIL_PATTERN, '[redacted]')
  for (const value of values) {
    if (!value.trim()) continue
    for (const form of encodedForms(value)) {
      result = result.replace(new RegExp(escapeRegExp(form), 'gi'), '[redacted]')
    }
  }
  return result
}
