export const ACTIVE_QUEUE_STATUSES = new Set(['Waiting', 'Called', 'In Chair'])
export const TERMINAL_QUEUE_STATUSES = new Set(['Done', 'Cancelled', 'No-show'])
export const NO_SHOW_GRACE_MINUTES = 10

export function operatingDayKey(date, timeZone = 'local') {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
  if (timeZone !== 'local') options.timeZone = timeZone
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function getOperatingStatus(catalog, now = new Date()) {
  const zoneOptions = catalog.timeZone === 'local' ? {} : { timeZone: catalog.timeZone }
  const parts = new Intl.DateTimeFormat('en-US', {
    ...zoneOptions,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(values.weekday)
  const hours = catalog.hours?.[weekdayIndex] ?? null
  const currentMinutes = Number(values.hour) * 60 + Number(values.minute)
  let status = 'CLOSED'
  let isOpen = false
  let minutesUntilClose = null

  if (hours) {
    const opensAt = minutesFromClock(hours.opensAt)
    const closesAt = minutesFromClock(hours.closesAt)
    if (hours.isOpen === false) {
      status = 'CLOSED'
    } else if (currentMinutes < opensAt) {
      status = opensAt - currentMinutes <= 60 ? 'OPENING_SOON' : 'CLOSED'
    } else if (currentMinutes < closesAt) {
      isOpen = true
      minutesUntilClose = closesAt - currentMinutes
      status = minutesUntilClose <= 60 ? 'CLOSING_SOON' : 'OPEN'
    }
  }

  const cutoffMinutes = Math.max(0, Number(catalog.onlineCutoffMinutes ?? 30))
  const queueControls = catalog.queueControls ?? {}
  return {
    status,
    isOpen,
    minutesUntilClose,
    hours,
    onlineCutoffMinutes: cutoffMinutes,
    onlineJoiningOpen: isOpen && currentMinutes < minutesFromClock(hours.closesAt) - cutoffMinutes && !queueControls.onlinePaused,
    walkInsOpen: isOpen && !queueControls.walkInsPaused,
  }
}

export function normalizePhone(phone) {
  return String(phone ?? '').replace(/\D/g, '')
}

export function isActiveQueueEntry(entry) {
  return ACTIVE_QUEUE_STATUSES.has(entry.status)
}

export function getServiceDuration(entry) {
  return (entry.services ?? []).reduce((sum, service) => sum + Number(service.durationMinutes || 0), 0)
}

function minutesFromClock(value) {
  const [hour, minute] = String(value ?? '00:00').split(':').map(Number)
  return hour * 60 + minute
}

function getBusyBarberIds(entries) {
  return new Set(entries
    .filter((entry) => entry.status === 'Called' || entry.status === 'In Chair')
    .map((entry) => entry.assignedBarberId)
    .filter(Boolean))
}

export function getBarberAssignment(entry, entries, catalog) {
  const busyBarberIds = getBusyBarberIds(entries)
  const available = catalog.barbers.filter((barber) => barber.active && barber.availability === 'AVAILABLE')
  if (entry.barberPreference?.kind === 'SPECIFIC') {
    const barber = available.find((candidate) => candidate.id === entry.barberPreference.barberId)
    if (!barber) return { barber: null, reason: 'queue.preferredBarberUnavailable' }
    if (busyBarberIds.has(barber.id)) return { barber: null, reason: 'queue.preferredBarberBusy' }
    return { barber, reason: null }
  }
  const barber = available.find((candidate) => !busyBarberIds.has(candidate.id))
  return barber ? { barber, reason: null } : { barber: null, reason: 'queue.noBarberAvailable' }
}

export function getNextCallableEntry(entries, catalog) {
  const waiting = entries
    .filter((entry) => entry.status === 'Waiting')
    .sort((left, right) => left.queueOrder - right.queueOrder)
  const blocked = []
  for (const entry of waiting) {
    const assignment = getBarberAssignment(entry, entries, catalog)
    if (assignment.barber) return { entry, barber: assignment.barber, blocked }
    blocked.push({ entry, reason: assignment.reason })
  }
  return { entry: null, barber: null, blocked }
}

export function calculateWaitEstimates(entries, catalog, now = new Date()) {
  const workloads = new Map()
  for (const barber of catalog.barbers.filter((item) => item.active && item.availability === 'AVAILABLE')) {
    workloads.set(barber.id, 0)
  }

  for (const entry of entries.filter((item) => item.status === 'Called' || item.status === 'In Chair')) {
    const assignedBarber = catalog.barbers.find((barber) => barber.id === entry.assignedBarberId)
    if (!assignedBarber || !workloads.has(assignedBarber.id)) continue
    let remaining = getServiceDuration(entry)
    if (entry.status === 'In Chair' && entry.startedAt) {
      const elapsedMinutes = Math.max(0, (now.getTime() - new Date(entry.startedAt).getTime()) / 60_000)
      remaining = Math.max(0, remaining - elapsedMinutes)
    }
    workloads.set(assignedBarber.id, remaining)
  }

  const estimates = new Map()
  const waiting = entries.filter((entry) => entry.status === 'Waiting').sort((left, right) => left.queueOrder - right.queueOrder)
  for (const entry of waiting) {
    const eligible = catalog.barbers.filter((barber) => barber.active && barber.availability === 'AVAILABLE' && workloads.has(barber.id))
    let candidates = eligible
    if (entry.barberPreference?.kind === 'SPECIFIC') {
      candidates = eligible.filter((barber) => barber.id === entry.barberPreference.barberId)
    }
    if (!candidates.length) {
      estimates.set(entry.id, null)
      continue
    }
    const selected = candidates.reduce((best, barber) => {
      if (!best || workloads.get(barber.id) < workloads.get(best.id)) return barber
      return best
    }, null)
    estimates.set(entry.id, Math.round(workloads.get(selected.id)))
    workloads.set(selected.id, workloads.get(selected.id) + getServiceDuration(entry))
  }
  return estimates
}

export function getQueuePosition(entryId, entries) {
  const entry = entries.find((item) => item.id === entryId)
  if (!entry || entry.status !== 'Waiting') return null
  return entries.filter((item) => item.status === 'Waiting' && item.queueOrder < entry.queueOrder).length + 1
}

export function getNoShowRemainingMs(entry, now = new Date()) {
  if (entry.status !== 'Called' || !entry.calledAt) return null
  return Math.max(0, NO_SHOW_GRACE_MINUTES * 60_000 - (new Date(now).getTime() - new Date(entry.calledAt).getTime()))
}

export function getDailyStatistics(entries, catalog = null, now = new Date()) {
  const completed = entries.filter((entry) => entry.status === 'Done')
  const waitingDurations = completed.map((entry) => entry.calledAt && entry.createdAt
    ? (new Date(entry.calledAt) - new Date(entry.createdAt)) / 60_000
    : null).filter(Number.isFinite)
  const serviceDurations = completed.map((entry) => entry.startedAt && entry.completedAt
    ? (new Date(entry.completedAt) - new Date(entry.startedAt)) / 60_000
    : null).filter(Number.isFinite)
  const average = (values) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null
  const hours = catalog?.hours?.[now.getDay()]
  const scheduledMinutes = hours?.opensAt && hours?.closesAt ? Math.max(0, minutesFromClock(hours.closesAt) - minutesFromClock(hours.opensAt)) : 0
  const workingBarberCount = catalog?.barbers?.filter((barber) => barber.active).length ?? 0
  const servedMinutes = completed.reduce((sum, entry) => {
    if (!entry.startedAt || !entry.completedAt) return sum
    return sum + Math.max(0, (new Date(entry.completedAt) - new Date(entry.startedAt)) / 60_000)
  }, 0)
  const hourCounts = new Map()
  for (const entry of entries) {
    const hour = new Date(entry.createdAt).getHours()
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
  }
  const peakHour = [...hourCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null
  return {
    registrations: entries.length,
    waiting: entries.filter((entry) => entry.status === 'Waiting').length,
    called: entries.filter((entry) => entry.status === 'Called').length,
    inChair: entries.filter((entry) => entry.status === 'In Chair').length,
    completed: completed.length,
    noShows: entries.filter((entry) => entry.status === 'No-show').length,
    cancelled: entries.filter((entry) => entry.status === 'Cancelled').length,
    averageWaitMinutes: average(waitingDurations),
    averageServiceMinutes: average(serviceDurations),
    barberUtilizationPercent: scheduledMinutes && workingBarberCount
      ? Math.min(100, Math.round(servedMinutes / (scheduledMinutes * workingBarberCount) * 100))
      : null,
    peakHour,
  }
}
