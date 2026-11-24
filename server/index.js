import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { pool } from './db/pool.js'

const app = express()
const port = Number(process.env.PORT ?? 10000)
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    return callback(null, false)
  },
}))
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get('/api/ready', async (_request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ready', database: 'connected' })
  } catch (error) {
    console.error('Readiness check failed', error)
    response.status(503).json({ status: 'not-ready' })
  }
})

app.use((_request, response) => {
  response.status(404).json({ error: 'not_found' })
})

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`ELITE API listening on 0.0.0.0:${port}`)
})

async function shutdown(signal) {
  console.log(`Received ${signal}; closing API server`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
