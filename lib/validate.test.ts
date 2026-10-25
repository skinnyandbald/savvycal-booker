import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isAllowed,
  isDuration,
  isEmail,
  isIsoTimestamp,
  isName,
  isSafeSegment,
  isTimeZone,
} from './validate.ts'

test('isSafeSegment rejects path traversal and URL metacharacters', () => {
  for (const value of ['../../me', '..', 'a/b', 'x?y=1', 'x#y', '..%2Fme', 'a b', '', 'a'.repeat(101)]) {
    assert.equal(isSafeSegment(value), false, value)
  }
})

test('isSafeSegment rejects non-strings', () => {
  for (const value of [undefined, null, 42, {}, ['link']]) {
    assert.equal(isSafeSegment(value), false)
  }
})

test('isSafeSegment accepts link ids and slugs', () => {
  assert.equal(isSafeSegment('link_01ABCdef'), true)
  assert.equal(isSafeSegment('chat-30'), true)
  assert.equal(isSafeSegment('a'.repeat(100)), true)
})

test('isEmail', () => {
  assert.equal(isEmail('jane@example.com'), true)
  assert.equal(isEmail('x.y+z@sub.example.co'), true)
  for (const value of ['', 'jane', 'jane@', 'jane@example', 'ja ne@example.com', `${'a'.repeat(250)}@x.co`, 42]) {
    assert.equal(isEmail(value), false, String(value))
  }
})

test('isName', () => {
  assert.equal(isName('Jane Doe'), true)
  assert.equal(isName('a'.repeat(200)), true)
  for (const value of ['', '   ', 'a'.repeat(201), null, 7]) {
    assert.equal(isName(value), false, String(value))
  }
})

test('isIsoTimestamp', () => {
  assert.equal(isIsoTimestamp('2024-01-15T14:00:00Z'), true)
  assert.equal(isIsoTimestamp('2024-01-15T14:00:00.000-05:00'), true)
  for (const value of ['garbage', '', `2024-01-15T14:00:00Z${' '.repeat(30)}`, 1705327200000, null]) {
    assert.equal(isIsoTimestamp(value), false, String(value))
  }
})

test('isDuration', () => {
  assert.equal(isDuration(1), true)
  assert.equal(isDuration(30), true)
  assert.equal(isDuration(1440), true)
  for (const value of [0, -5, 1441, 25.5, NaN, '30', null]) {
    assert.equal(isDuration(value), false, String(value))
  }
})

test('isTimeZone', () => {
  assert.equal(isTimeZone('America/New_York'), true)
  assert.equal(isTimeZone('UTC'), true)
  for (const value of ['Not/AZone', '', 'a'.repeat(65), 5, null]) {
    assert.equal(isTimeZone(value), false, String(value))
  }
})

test('isAllowed allows any value when the list is unset or empty', () => {
  assert.equal(isAllowed('link_a', undefined), true)
  assert.equal(isAllowed('link_a', ''), true)
  assert.equal(isAllowed('link_a', ' , '), true)
})

test('isAllowed enforces a non-empty list', () => {
  assert.equal(isAllowed('link_a', 'link_a'), true)
  assert.equal(isAllowed('link_b', 'link_a, link_b ,link_c'), true)
  assert.equal(isAllowed('link_x', 'link_a,link_b'), false)
  assert.equal(isAllowed('link', 'link_a'), false)
})
