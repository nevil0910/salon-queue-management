import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import * as queueService from './queueService.js'
import { pool as defaultPool } from './db/pool.js'

export function createApp({ queue = queueService, pool = defaultPool } = {}) {
  const app = express()
  const allowedOrigins = new Set([
    ...(process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean),
    'https://salon-queue-management-1.onrender.com',
  ])
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.has(origin)) return callback(null, true); return callback(null, false) } }))
  app.use(express.json({ limit: '32kb' }))
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }))
  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))
  app.get('/api/ready', async (_request, response) => {
    try { await pool.query('SELECT 1'); response.json({ status: 'ready', database: 'connected' }) }
    catch (error) { console.error('Readiness check failed', error); response.status(503).json({ status: 'not-ready' }) }
  })

  const tokenFrom = (request) => (request.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const auth = async (request, response, next) => {
    try { request.staff = await queue.staffFromToken(tokenFrom(request)); if (!request.staff) return response.status(401).json({ error: 'auth.required' }); next() }
    catch (error) { next(error) }
  }
  const roles = (...allowed) => (request, response, next) => {
    if (!allowed.includes(request.staff?.role)) return response.status(403).json({ error: 'auth.forbidden' })
    next()
  }
  const wrap = (handler) => async (request, response, next) => {
    try { const result = await handler(request, response); if (!response.headersSent) response.json(result ?? { ok: true }) }
    catch (error) { next(error) }
  }

  app.post('/api/auth/login', wrap((request, response) => queue.staffLogin(request.body?.email, request.body?.password).then((result) => response.json(result))))
  app.get('/api/auth/session', auth, wrap((request) => ({ id: request.staff.id, email: request.staff.email, role: request.staff.role, barberId: request.staff.barber_id ?? null })))
  app.post('/api/auth/logout', auth, wrap((request) => queue.logout(tokenFrom(request))))
  app.get('/api/public/catalog', wrap(() => queue.publicCatalog()))
  app.get('/api/public/dashboard', wrap(() => queue.publicDashboard()))
  app.get('/api/public/snapshot', wrap(() => queue.publicSnapshot()))
  app.post('/api/public/registrations', wrap((request) => queue.register(request.body, 'ONLINE')))
  app.get('/api/customer/status/:token', wrap(async (request, response) => {
    const result = await queue.status(request.params.token)
    if (!result) return response.status(404).json({ error: 'queue.entryMissing' })
    return response.json(result)
  }))
  app.post('/api/customer/status/:token/cancel', wrap((request) => queue.cancelCustomer(request.params.token, request.body?.reason)))
  app.get('/api/staff/dashboard', auth, wrap((request) => queue.staffDashboard(request.staff)))
  app.post('/api/staff/registrations', auth, roles('OWNER', 'RECEPTION'), wrap((request) => queue.register(request.body, 'WALK_IN')))
  app.post('/api/staff/queue/call-next', auth, roles('OWNER', 'RECEPTION'), wrap(async (request) => {
    const current = await queue.dashboard()
    const { getNextCallableEntry } = await import('../src/lib/queueEngine.js')
    const next = getNextCallableEntry(current.entries, current.catalog)
    if (!next.entry) throw new Error('queue.noEligibleCustomer')
    return queue.mutateQueue(next.entry.id, 'call', request.staff)
  }))
  const queueActionRoles = { call: ['OWNER', 'RECEPTION'], start: ['OWNER', 'BARBER'], complete: ['OWNER', 'BARBER'], cancel: ['OWNER', 'RECEPTION'], 'no-show': ['OWNER', 'RECEPTION'] }
  for (const [action, allowedRoles] of Object.entries(queueActionRoles)) {
    app.post(`/api/staff/queue/:id/${action}`, auth, roles(...allowedRoles), wrap((request) => queue.mutateQueue(request.params.id, action, request.staff)))
  }
  app.patch('/api/staff/barbers/:id', auth, roles('OWNER', 'BARBER'), wrap((request) => {
    if (request.staff.role === 'BARBER' && request.staff.barber_id !== request.params.id) throw new Error('auth.forbidden')
    return queue.updateBarber(request.params.id, request.body)
  }))
  app.post('/api/owner/services', auth, roles('OWNER'), wrap((request) => queue.createService(request.body)))
  app.patch('/api/owner/services/:id', auth, roles('OWNER'), wrap((request) => queue.updateService(request.params.id, request.body)))
  app.delete('/api/owner/services/:id', auth, roles('OWNER'), wrap((request) => queue.archiveService(request.params.id)))
  app.post('/api/owner/barbers', auth, roles('OWNER'), wrap((request) => queue.createBarber(request.body)))
  app.patch('/api/owner/barbers/:id', auth, roles('OWNER'), wrap((request) => queue.updateBarber(request.params.id, request.body)))
  app.delete('/api/owner/barbers/:id', auth, roles('OWNER'), wrap((request) => queue.archiveBarber(request.params.id)))
  app.patch('/api/owner/settings', auth, roles('OWNER'), wrap((request) => queue.updateSettings(request.body)))
  app.post('/api/owner/staff', auth, roles('OWNER'), wrap((request) => queue.createStaff(request.body, request.staff)))

  app.get('/api/events', async (request, response) => {
    response.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
    response.flushHeaders?.()
    response.write('event: connected\ndata: {}\n\n')
    const client = await pool.connect()
    let open = true
    const send = () => { if (open) response.write('event: queue-updated\ndata: {}\n\n') }
    try {
      await client.query('LISTEN elite_queue_updates')
      client.on('notification', send)
      const ping = setInterval(() => { if (open) response.write(': ping\n\n') }, 25_000)
      request.on('close', () => { open = false; clearInterval(ping); client.release() })
    } catch (error) { client.release(); if (open) response.end() }
  })
  app.use((_request, response) => response.status(404).json({ error: 'not_found' }))
  app.use((error, _request, response, _next) => {
    if (error.code === '23505') return response.status(409).json({ error: 'validation.duplicatePhone' })
    if (error.code === '23503') return response.status(409).json({ error: 'queue.referenceConflict' })
    if (error.message === 'auth.forbidden') return response.status(403).json({ error: error.message })
    const known = /^(auth|queue|validation|join|salon)\./.test(error.message ?? '')
    if (known) return response.status(error.message.includes('conflict') ? 409 : 400).json({ error: error.message })
    console.error('API request failed', error)
    return response.status(500).json({ error: 'api.internalError' })
  })
  return app
}
