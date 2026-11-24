import { pool } from './pool.js'
import { salonPreviewCatalog } from '../../src/data/salonPreviewCatalog.js'

const salonId = process.env.SALON_ID ?? salonPreviewCatalog.salonId
const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query(`INSERT INTO salons (id, display_name, timezone, currency_code) VALUES ($1, 'ELITE — Salon & Grooming', $2, 'INR') ON CONFLICT (id) DO NOTHING`, [salonId, process.env.SALON_TIMEZONE ?? 'Asia/Kolkata'])
  await client.query(`INSERT INTO salon_settings (salon_id, settings) VALUES ($1, $2) ON CONFLICT (salon_id) DO NOTHING`, [salonId, JSON.stringify({ hours: salonPreviewCatalog.hours, onlineCutoffMinutes: 30, queueControls: { onlinePaused: false, walkInsPaused: false } })])
  for (const service of salonPreviewCatalog.services) {
    await client.query(`INSERT INTO services (id,salon_id,localized_name,localized_description,price_minor_units,duration_minutes,display_order,active) VALUES ($1,$2,$3,$4,$5,$6,$7,true) ON CONFLICT (salon_id,id) DO NOTHING`, [service.id,salonId,JSON.stringify(service.name),JSON.stringify(service.description),service.priceMinorUnits,service.durationMinutes,salonPreviewCatalog.services.indexOf(service)])
  }
  for (const barber of salonPreviewCatalog.barbers) {
    await client.query(`INSERT INTO barbers (id,salon_id,localized_name,active,availability) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (salon_id,id) DO NOTHING`, [barber.id,salonId,JSON.stringify(barber.name),barber.active,barber.availability])
  }
  await client.query('COMMIT')
} catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release(); await pool.end() }
