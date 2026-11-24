import { getNextCallableEntry, getOperatingStatus } from './queueEngine.js'
import { getQueueDashboard, getSalonCatalog, getSalonSnapshot as loadSnapshot } from './queueRepository.js'

export function getSalonSnapshot(now = new Date()) {
  const catalog = getSalonCatalog()
  if (!catalog) return null
  const operating = getOperatingStatus(catalog, now)
  const dashboard = getQueueDashboard(now)
  const nextCallable = getNextCallableEntry(dashboard.entries, catalog)
  return {
    ...operating,
    catalog,
    waitingCount: dashboard.waiting.length,
    nextEstimateMinutes: nextCallable.entry ? dashboard.estimates.get(nextCallable.entry.id) ?? null : null,
    availableBarbers: dashboard.barbers.filter((barber) => barber.effectiveAvailability === 'AVAILABLE').length,
    barbers: dashboard.barbers,
    services: catalog.services.filter((service) => service.active),
    localDay: dashboard.waiting[0]?.operatingDayKey ?? null,
    queueEntries: dashboard.entries,
  }
}

export { loadSnapshot }
