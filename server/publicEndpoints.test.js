import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from './app.js'
import { pool } from './db/pool.js'

const originalQuery = pool.query
const fixtureDate = new Date().toISOString().slice(0, 10)
pool.query = async (sql) => {
  if (sql === 'SELECT 1') return { rows: [{ '?column?': 1 }], rowCount: 1 }
  if (sql.includes('FROM salons WHERE id=$1')) return { rows: [{ id: 'elite-primary', display_name: 'ELITE', timezone: 'Asia/Kolkata', currency_code: 'INR' }], rowCount: 1 }
  if (sql.includes('FROM salon_settings WHERE salon_id=$1')) return { rows: [{ settings: { hours: Object.fromEntries(Array.from({ length: 7 }, (_, day) => [day, { opensAt: '10:00', closesAt: '22:00' }])), onlineCutoffMinutes: 30, queueControls: { onlinePaused: false, walkInsPaused: false } } }], rowCount: 1 }
  if (sql.includes('FROM services WHERE salon_id=$1')) return { rows: [{ id: 'cut', localized_name: { en: 'Cut', gu: 'કટ' }, localized_description: {}, price_minor_units: 1000, duration_minutes: 30, active: true }], rowCount: 1 }
  if (sql.includes('FROM barbers WHERE salon_id=$1')) return { rows: [{ id: 'barber-1', localized_name: { en: 'Barber 1', gu: 'બાર્બર ૧' }, active: true, availability: 'AVAILABLE' }], rowCount: 1 }
  if (sql.includes('FROM operating_days WHERE salon_id=$1')) return { rows: [{ id: 'day-1', business_date: fixtureDate }], rowCount: 1 }
  if (sql.includes('FROM queue_entries q JOIN operating_days')) return { rows: [], rowCount: 0 }
  throw new Error(`Unexpected SQL in endpoint regression test: ${sql}`)
}
after(() => {
  pool.query = originalQuery
  if (server?.listening) server.close()
})

const app = createApp()
let server
let base
test('public catalog endpoint reads the migrated catalog schema', async (context) => {
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
  const response = await fetch(`${base}/api/public/catalog`)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.salonId, 'elite-primary')
  assert.equal(body.services[0].id, 'cut')
  assert.equal(body.barbers[0].id, 'barber-1')
})

test('public dashboard endpoint returns empty day state without requiring a registration', async () => {
  const response = await fetch(`${base}/api/public/dashboard`)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.deepEqual(body.entries, [])
  assert.deepEqual(body.waiting, [])
  assert.deepEqual(body.blocked, [])
})

test('public snapshot endpoint returns catalog and operating summary', async () => {
  const response = await fetch(`${base}/api/public/snapshot`)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.catalog.salonId, 'elite-primary')
  assert.equal(body.waitingCount, 0)
  assert.equal(body.services[0].id, 'cut')
})
