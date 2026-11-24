import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { pool } from './pool.js'

const migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), 'migrations')
const client = await pool.connect()

try {
  await client.query('BEGIN')
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  const files = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const applied = await client.query(
      'SELECT 1 FROM schema_migrations WHERE migration_name = $1',
      [file],
    )
    if (applied.rowCount) continue

    const sql = await readFile(join(migrationsDirectory, file), 'utf8')
    await client.query(sql)
    await client.query('INSERT INTO schema_migrations (migration_name) VALUES ($1)', [file])
    console.log(`Applied migration ${file}`)
  }

  await client.query('COMMIT')
} catch (error) {
  await client.query('ROLLBACK')
  console.error('Database migration failed', error)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
