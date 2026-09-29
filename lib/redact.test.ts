import { test } from 'node:test'
import assert from 'node:assert/strict'
import { redact } from './redact.ts'

test('redacts submitted values case-insensitively', () => {
  const body = '{"errors":{"display_name":["Chris Collins is invalid"]}}'
  assert.equal(redact(body, ['chris collins']), '{"errors":{"display_name":["[redacted] is invalid"]}}')
})

test('redacts any email address, even if not in the submitted values', () => {
  const body = '{"errors":{"email":["cwc@firstatlantic.boston is taken"],"other":"x.y+z@example.co"}}'
  assert.equal(redact(body, []), '{"errors":{"email":["[redacted] is taken"],"other":"[redacted]"}}')
})

test('escapes regex characters in submitted values', () => {
  assert.equal(redact('name a.b (c) here', ['a.b (c)']), 'name [redacted] here')
  assert.equal(redact('aXb', ['a.b']), 'aXb')
})

test('ignores blank values and leaves safe text intact', () => {
  assert.equal(redact('start_at is not available', ['', '  ']), 'start_at is not available')
})
