import { createApp } from './app.js'
import { pool } from './db/pool.js'

const port = Number(process.env.PORT ?? 10000)
const server = createApp().listen(port, '0.0.0.0', () => console.log(`ELITE API listening on 0.0.0.0:${port}`))

async function shutdown(signal) {
  console.log(`Received ${signal}; closing API server`)
  server.close(async () => { await pool.end(); process.exit(0) })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
