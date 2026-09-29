import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractErrorMessage } from './extract-error-message.ts'

const DEFAULT = 'Failed to create booking'

test('uses top-level message', () => {
  assert.equal(extractErrorMessage('{"message":"Slot unavailable"}', DEFAULT), 'Slot unavailable')
})

test('uses string error', () => {
  assert.equal(extractErrorMessage('{"error":"Bad request"}', DEFAULT), 'Bad request')
})

test('uses nested error.message', () => {
  assert.equal(extractErrorMessage('{"error":{"message":"Nested"}}', DEFAULT), 'Nested')
})

test('flattens field errors object', () => {
  const body = JSON.stringify({ errors: { start_at: ['is not available'], email: ['is invalid'] } })
  assert.equal(extractErrorMessage(body, DEFAULT), 'start_at is not available; email is invalid')
})

test('handles errors object with string values', () => {
  assert.equal(extractErrorMessage('{"errors":{"detail":"Unprocessable Entity"}}', DEFAULT), 'Unprocessable Entity')
})

test('handles errors array', () => {
  const body = JSON.stringify({ errors: ['Time is outside scheduling notice', { message: 'Other' }] })
  assert.equal(extractErrorMessage(body, DEFAULT), 'Time is outside scheduling notice; Other')
})

test('falls back to raw text for non-JSON', () => {
  assert.equal(extractErrorMessage('Unprocessable', DEFAULT), 'Unprocessable')
})

test('falls back to default for empty body or unknown shape', () => {
  assert.equal(extractErrorMessage('', DEFAULT), DEFAULT)
  assert.equal(extractErrorMessage('{}', DEFAULT), DEFAULT)
})

test('skips empty message in favor of populated errors', () => {
  const body = JSON.stringify({ message: '', errors: { start_at: ['is not available'] } })
  assert.equal(extractErrorMessage(body, DEFAULT), 'start_at is not available')
})

test('message takes precedence over errors', () => {
  const body = JSON.stringify({ message: 'Top', errors: { start_at: ['bad'] } })
  assert.equal(extractErrorMessage(body, DEFAULT), 'Top')
})

test('ignores non-string items in field arrays', () => {
  const body = JSON.stringify({ errors: { start_at: [{ message: 'is taken' }, null] } })
  assert.equal(extractErrorMessage(body, DEFAULT), 'start_at is taken')
})

test('handles non-object JSON bodies', () => {
  assert.equal(extractErrorMessage('null', DEFAULT), DEFAULT)
  assert.equal(extractErrorMessage('5', DEFAULT), DEFAULT)
  assert.equal(extractErrorMessage('"Slot taken"', DEFAULT), 'Slot taken')
})

test('skips blank string values in errors object', () => {
  assert.equal(extractErrorMessage('{"errors":{"detail":""}}', DEFAULT), DEFAULT)
  assert.equal(extractErrorMessage('{"errors":{"start_at":" "}}', DEFAULT), DEFAULT)
})

test('falls back to default for whitespace-only non-JSON body', () => {
  assert.equal(extractErrorMessage('   ', DEFAULT), DEFAULT)
})

test('handles Cal.com v2 error shape', () => {
  const body = JSON.stringify({ status: 'error', error: { code: 'BadRequestException', message: 'User is not available' } })
  assert.equal(extractErrorMessage(body, DEFAULT), 'User is not available')
})
