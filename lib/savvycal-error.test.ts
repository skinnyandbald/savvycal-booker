import { test } from 'node:test'
import assert from 'node:assert/strict'
import { savvyCalErrorMessage, SLOT_UNAVAILABLE_MESSAGE } from './savvycal-error.ts'

test('maps start_at validation error to slot-unavailable message', () => {
  // Actual SavvyCal 422 body for a time that isn't an open slot on the link
  const body = '{"errors":{"start_at":[{"message":"is invalid"}]}}'
  assert.equal(savvyCalErrorMessage(body), SLOT_UNAVAILABLE_MESSAGE)
})

test('passes through other errors', () => {
  assert.equal(savvyCalErrorMessage('{"errors":{"email":["is invalid"]}}'), 'email is invalid')
})

test('falls back to default for unparseable body', () => {
  assert.equal(savvyCalErrorMessage(''), 'Failed to create booking')
})
