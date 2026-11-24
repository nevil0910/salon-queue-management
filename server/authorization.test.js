import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from './app.js'
import { filterStaffDashboardForBarber } from './queueService.js'

const accounts = {
  owner: { id: 'owner-1', email: 'owner@example.test', role: 'OWNER', barber_id: null, salon_id: 'elite-primary' },
  receptionist: { id: 'reception-1', email: 'reception@example.test', role: 'RECEPTION', barber_id: null, salon_id: 'elite-primary' },
  barber: { id: 'barber-account-1', email: 'barber@example.test', role: 'BARBER', barber_id: 'stylist-01', salon_id: 'elite-primary' },
}
const calls = []
const queue = {
  async staffFromToken(token) { return accounts[token] ?? null },
  async publicCatalog() { return { salonId: 'elite-primary' } },
  async mutateQueue(id, action, account) { calls.push({ id, action, role: account.role }); return { ok: true } },
  async updateSettings() { calls.push({ action: 'settings' }); return { ok: true } },
}
const app = createApp({ queue, pool: { query: async () => ({ rows: [] }) } })
const server = app.listen(0, '127.0.0.1')
const base = await new Promise((resolve) => server.once('listening', () => resolve(`http://127.0.0.1:${server.address().port}`)))
after(() => new Promise((resolve) => server.close(resolve)))

async function request(path, token, method = 'POST') {
  return fetch(`${base}${path}`, { method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: method === 'GET' ? undefined : '{}' })
}

test('authenticated session endpoint identifies the role attached to a valid token', async () => {
  const response = await request('/api/auth/session', 'barber', 'GET')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { id: 'barber-account-1', email: 'barber@example.test', role: 'BARBER', barberId: 'stylist-01' })
})

test('Render frontend origin is allowed to call the API', async () => {
  const response = await fetch(`${base}/api/public/catalog`, { headers: { origin: 'https://salon-queue-management-1.onrender.com' } })
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://salon-queue-management-1.onrender.com')
})

test('barbers cannot enter reception or owner only queue operations', async () => {
  calls.length = 0
  assert.equal((await request('/api/staff/queue/entry-1/cancel', 'barber')).status, 403)
  assert.equal((await request('/api/staff/queue/entry-1/no-show', 'barber')).status, 403)
  assert.equal((await request('/api/owner/settings', 'barber', 'PATCH')).status, 403)
  assert.deepEqual(calls, [])
})

test('receptionists can call and cancel but cannot perform barber service transitions', async () => {
  calls.length = 0
  assert.equal((await request('/api/staff/queue/entry-1/call', 'receptionist')).status, 200)
  assert.equal((await request('/api/staff/queue/entry-1/cancel', 'receptionist')).status, 200)
  assert.equal((await request('/api/staff/queue/entry-1/start', 'receptionist')).status, 403)
  assert.deepEqual(calls.map(({ action }) => action), ['call', 'cancel'])
})

test('barbers may invoke service transitions but cannot call queue entries', async () => {
  calls.length = 0
  assert.equal((await request('/api/staff/queue/entry-1/start', 'barber')).status, 200)
  assert.equal((await request('/api/staff/queue/entry-1/complete', 'barber')).status, 200)
  assert.equal((await request('/api/staff/queue/entry-1/call', 'barber')).status, 403)
  assert.deepEqual(calls.map(({ action }) => action), ['start', 'complete'])
})

test('barber dashboards expose only the barber linked to the signed-in staff account', () => {
  const dashboard = {
    catalog: { barbers: [{ id: 'vivek' }, { id: 'other' }] },
    barbers: [{ id: 'vivek' }, { id: 'other' }],
    entries: [], waiting: [], called: [], inChair: [], completed: [], noShows: [], cancelled: [],
  }
  const result = filterStaffDashboardForBarber(dashboard, 'vivek')
  assert.deepEqual(result.catalog.barbers.map(({ id }) => id), ['vivek'])
  assert.deepEqual(result.barbers.map(({ id }) => id), ['vivek'])
  assert.throws(() => filterStaffDashboardForBarber({ ...dashboard, catalog: { barbers: [{ id: 'other' }] } }, 'vivek'), /auth\.forbidden/)
})
