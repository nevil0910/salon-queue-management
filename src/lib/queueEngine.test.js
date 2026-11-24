import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateWaitEstimates,
  getNoShowRemainingMs,
  getNextCallableEntry,
  getOperatingStatus,
  getQueuePosition,
} from './queueEngine.js'

const baseCatalog = {
  timeZone: 'local',
  onlineCutoffMinutes: 30,
  queueControls: { onlinePaused: false, walkInsPaused: false },
  hours: Object.fromEntries(Array.from({ length: 7 }, (_, day) => [day, { isOpen: true, opensAt: '10:00', closesAt: '22:00' }])),
  barbers: [
    { id: 'a', active: true, availability: 'AVAILABLE' },
    { id: 'b', active: true, availability: 'AVAILABLE' },
  ],
  services: [],
}

function waiting(id, queueOrder, preference = { kind: 'ANY', barberId: null }, durationMinutes = 30) {
  return {
    id,
    queueOrder,
    status: 'Waiting',
    barberPreference: preference,
    services: [{ durationMinutes }],
  }
}

test('online intake closes at the configured cutoff while walk-ins can remain open', () => {
  const at = (hour, minute) => {
    const value = new Date()
    value.setHours(hour, minute, 0, 0)
    return value
  }
  assert.equal(getOperatingStatus(baseCatalog, at(21, 29)).onlineJoiningOpen, true)
  const cutoff = getOperatingStatus(baseCatalog, at(21, 30))
  assert.equal(cutoff.onlineJoiningOpen, false)
  assert.equal(cutoff.walkInsOpen, true)
  assert.equal(getOperatingStatus({ ...baseCatalog, queueControls: { onlinePaused: true } }, at(15, 0)).onlineJoiningOpen, false)
})

test('a specific-barber request is never assigned elsewhere; blocked entries remain visible', () => {
  const first = waiting('specific-a', 1, { kind: 'SPECIFIC', barberId: 'a' })
  const later = waiting('any-b', 2)
  const serving = { id: 'busy-a', status: 'In Chair', assignedBarberId: 'a', services: [{ durationMinutes: 20 }] }
  const result = getNextCallableEntry([first, later, serving], baseCatalog)
  assert.equal(result.entry.id, 'any-b')
  assert.equal(result.barber.id, 'b')
  assert.equal(result.blocked[0].entry.id, 'specific-a')
  assert.equal(result.blocked[0].reason, 'queue.preferredBarberBusy')
})

test('Any Barber uses the first stable eligible barber and never a barber on break', () => {
  const catalog = { ...baseCatalog, barbers: [baseCatalog.barbers[0], { ...baseCatalog.barbers[1], availability: 'ON_BREAK' }] }
  const result = getNextCallableEntry([waiting('any', 1)], catalog)
  assert.equal(result.barber.id, 'a')
  const none = getNextCallableEntry([waiting('specific-b', 1, { kind: 'SPECIFIC', barberId: 'b' })], catalog)
  assert.equal(none.entry, null)
  assert.equal(none.blocked[0].reason, 'queue.preferredBarberUnavailable')
})

test('wait estimates account for current work, service durations, and barber preferences', () => {
  const now = new Date('2026-11-24T10:00:00')
  const entries = [
    { id: 'in-chair-a', status: 'In Chair', assignedBarberId: 'a', startedAt: now.toISOString(), services: [{ durationMinutes: 20 }] },
    waiting('specific-a', 1, { kind: 'SPECIFIC', barberId: 'a' }, 30),
    waiting('any-first', 2, { kind: 'ANY', barberId: null }, 30),
    waiting('any-second', 3, { kind: 'ANY', barberId: null }, 25),
  ]
  const estimates = calculateWaitEstimates(entries, baseCatalog, now)
  assert.equal(estimates.get('specific-a'), 20)
  assert.equal(estimates.get('any-first'), 0)
  assert.equal(estimates.get('any-second'), 30)
})

test('queue position is recalculated from waiting entries only', () => {
  const entries = [
    waiting('one', 1),
    { id: 'called', queueOrder: 2, status: 'Called' },
    waiting('three', 3),
  ]
  assert.equal(getQueuePosition('three', entries), 2)
  assert.equal(getQueuePosition('called', entries), null)
})

test('no-show grace period cannot expire before ten minutes', () => {
  const calledAt = new Date('2026-11-24T10:00:00Z')
  const entry = { status: 'Called', calledAt: calledAt.toISOString() }
  assert.equal(getNoShowRemainingMs(entry, new Date(calledAt.getTime() + 9 * 60_000)), 60_000)
  assert.equal(getNoShowRemainingMs(entry, new Date(calledAt.getTime() + 10 * 60_000)), 0)
})
