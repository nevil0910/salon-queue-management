import { salonPreviewCatalog } from '../data/salonPreviewCatalog.js'
import {
  calculateWaitEstimates,
  getBarberAssignment,
  getDailyStatistics,
  getNextCallableEntry,
  getNoShowRemainingMs as getEngineNoShowRemainingMs,
  getOperatingStatus,
  getQueuePosition,
  getServiceDuration,
  isActiveQueueEntry,
  normalizePhone,
  operatingDayKey,
} from './queueEngine.js'

export const QUEUE_STORAGE_KEY = 'elite.queue.entries.v1'
export const CATALOG_STORAGE_KEY = 'elite.salon.catalog.v1'
export const QUEUE_UPDATED_EVENT = 'elite:queue-updated'
const STATE_LOCK = 'elite:salon-state-write'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function announceUpdate() {
  window.dispatchEvent(new CustomEvent(QUEUE_UPDATED_EVENT))
}

function withLock(name, operation) {
  if (window.navigator?.locks?.request) return window.navigator.locks.request(name, operation)
  return Promise.resolve().then(operation)
}

function readEntries() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUEUE_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    throw new Error('validation.storageUnavailable')
  }
}

function writeEntries(entries) {
  try {
    window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(entries))
    announceUpdate()
  } catch {
    throw new Error('validation.storageUnavailable')
  }
}

function readCatalog() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CATALOG_STORAGE_KEY) ?? 'null')
    if (!parsed || typeof parsed !== 'object') return clone(salonPreviewCatalog)
    return {
      ...clone(salonPreviewCatalog),
      ...parsed,
      hours: { ...clone(salonPreviewCatalog.hours), ...(parsed.hours ?? {}) },
      services: Array.isArray(parsed.services) ? parsed.services : clone(salonPreviewCatalog.services),
      barbers: Array.isArray(parsed.barbers) ? parsed.barbers : clone(salonPreviewCatalog.barbers),
      queueControls: { ...salonPreviewCatalog.queueControls, ...(parsed.queueControls ?? {}) },
    }
  } catch {
    throw new Error('validation.storageUnavailable')
  }
}

function writeCatalog(catalog) {
  try {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog))
    announceUpdate()
  } catch {
    throw new Error('validation.storageUnavailable')
  }
}

function todayKey(now, catalog) {
  return operatingDayKey(now, catalog.timeZone)
}

function currentEntries(now, catalog) {
  const dateKey = todayKey(now, catalog)
  return readEntries()
    .filter((entry) => entry.salonId === catalog.salonId && entry.operatingDayKey === dateKey)
    .sort((left, right) => left.queueOrder - right.queueOrder)
}

function addEvent(entry, status, at, actor, details = {}) {
  const event = { status, at: at.toISOString(), actor, ...details }
  return { ...entry, status, events: [...(entry.events ?? []), event] }
}

function findEntry(entries, id) {
  const entry = entries.find((item) => item.id === id)
  if (!entry) throw new Error('queue.entryMissing')
  return entry
}

function effectiveBarbers(entries, catalog) {
  return catalog.barbers.map((barber) => {
    const assignment = entries.find((entry) =>
      (entry.status === 'Called' || entry.status === 'In Chair') && entry.assignedBarberId === barber.id,
    )
    return {
      ...barber,
      effectiveAvailability: barber.availability !== 'AVAILABLE'
        ? barber.availability
        : assignment?.status === 'In Chair'
          ? 'SERVING'
          : assignment?.status === 'Called'
            ? 'CALLED'
            : 'AVAILABLE',
      activeEntry: assignment ?? null,
    }
  })
}

function registrationFromOptions(options, catalog, entries, now) {
  const name = String(options.customerName ?? '').trim()
  const normalizedPhone = normalizePhone(options.phone)
  const source = options.source ?? 'ONLINE'
  const salonId = options.salonId ?? catalog.salonId
  const dateKey = todayKey(now, catalog)

  if (!name) throw new Error('validation.nameRequired')
  if (normalizedPhone.length < 7 || normalizedPhone.length > 15) throw new Error('validation.phoneInvalid')
  if (!Array.isArray(options.selectedServices) || !options.selectedServices.length) throw new Error('validation.serviceRequired')
  if (!['ANY', 'SPECIFIC'].includes(options.barberPreference?.kind) || (options.barberPreference.kind === 'SPECIFIC' && !options.barberPreference.barberId)) {
    throw new Error('validation.barberRequired')
  }

  const operating = getOperatingStatus(catalog, now)
  if (source === 'ONLINE' && !operating.onlineJoiningOpen) throw new Error('join.onlineClosed')
  if (source === 'WALK_IN' && (!operating.walkInsOpen || catalog.queueControls?.walkInsPaused)) throw new Error('join.walkInsClosed')
  if (!['ONLINE', 'WALK_IN'].includes(source)) throw new Error('validation.registrationSourceInvalid')

  const duplicate = entries.find((entry) =>
    entry.salonId === salonId &&
    entry.operatingDayKey === dateKey &&
    entry.normalizedPhone === normalizedPhone &&
    isActiveQueueEntry(entry),
  )
  if (duplicate) throw new Error('validation.duplicatePhone')

  const services = options.selectedServices.map((serviceId) => {
    const service = catalog.services.find((item) => item.id === serviceId && item.active)
    if (!service) throw new Error('validation.serviceUnavailable')
    return {
      serviceId: service.id,
      nameSnapshot: typeof service.name === 'string' ? service.name : service.name[options.language ?? 'en'],
      priceMinorUnits: service.priceMinorUnits,
      durationMinutes: service.durationMinutes,
    }
  })

  const sequence = entries.reduce((highest, entry) => Math.max(highest, Number(entry.tokenSequence) || 0), 0) + 1
  const queueOrder = entries.reduce((highest, entry) => Math.max(highest, Number(entry.queueOrder) || 0), 0) + 1
  const id = window.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const barberPreference = options.barberPreference.kind === 'ANY'
    ? { kind: 'ANY', barberId: null, barberNameSnapshot: null }
    : (() => {
      const selection = { id: 'new-entry', barberPreference: options.barberPreference }
      const barber = getBarberAssignment(selection, entries, catalog).barber
      if (!barber) throw new Error('validation.barberUnavailable')
      return {
        kind: 'SPECIFIC',
        barberId: barber.id,
        barberNameSnapshot: typeof barber.name === 'string' ? barber.name : barber.name[options.language ?? 'en'],
      }
    })()

  const registration = {
    id,
    salonId,
    operatingDayKey: dateKey,
    tokenSequence: sequence,
    token: `E-${String(sequence).padStart(3, '0')}`,
    queueOrder,
    customer: { displayName: name, phone: String(options.phone).trim() },
    normalizedPhone,
    services,
    barberPreference,
    assignedBarberId: null,
    status: 'Waiting',
    source,
    createdAt: now.toISOString(),
    estimatedWaitingMinutes: null,
    events: [{ status: 'Waiting', at: now.toISOString(), actor: source }],
    storageMode: 'local-preview',
  }
  registration.estimatedWaitingMinutes = calculateWaitEstimates([...entries, registration], catalog, now).get(registration.id) ?? null
  return registration
}

export function getSalonCatalog() {
  return readCatalog()
}

export function getQueueEntries({ salonId, operatingDayKey: dateKey, now = new Date() } = {}) {
  const catalog = getSalonCatalog()
  return currentEntries(now, catalog)
    .filter((entry) => !salonId || entry.salonId === salonId)
    .filter((entry) => !dateKey || entry.operatingDayKey === dateKey)
}

export function getActiveQueueEntries(options) {
  return getQueueEntries(options).filter(isActiveQueueEntry)
}

export function getRegistrationById(id) {
  return readEntries().find((entry) => entry.id === id) ?? null
}

export function getQueueDashboard(now = new Date()) {
  const catalog = getSalonCatalog()
  const entries = currentEntries(now, catalog)
  const waiting = entries.filter((entry) => entry.status === 'Waiting')
  const estimates = calculateWaitEstimates(entries, catalog, now)
  return {
    catalog,
    entries,
    waiting,
    called: entries.filter((entry) => entry.status === 'Called'),
    inChair: entries.filter((entry) => entry.status === 'In Chair'),
    completed: entries.filter((entry) => entry.status === 'Done'),
    noShows: entries.filter((entry) => entry.status === 'No-show'),
    cancelled: entries.filter((entry) => entry.status === 'Cancelled'),
    barbers: effectiveBarbers(entries, catalog),
    statistics: getDailyStatistics(entries, catalog, now),
    estimates,
    blocked: waiting.map((entry) => ({ entry, ...getBarberAssignment(entry, entries, catalog) })).filter((item) => !item.barber),
  }
}

export function getRegistrationStatus(id, now = new Date()) {
  const catalog = getSalonCatalog()
  const entries = currentEntries(now, catalog)
  const entry = readEntries().find((item) => item.id === id)
  if (!entry || entry.salonId !== catalog.salonId) return null
  return {
    entry,
    position: getQueuePosition(entry.id, entries),
    estimatedWaitingMinutes: calculateWaitEstimates(entries, catalog, now).get(entry.id) ?? null,
    entriesAhead: entry.status === 'Waiting' ? Math.max(0, getQueuePosition(entry.id, entries) - 1) : null,
  }
}

export function getCurrentServing(now = new Date()) {
  const dashboard = getQueueDashboard(now)
  return dashboard.inChair.map((entry) => ({
    token: entry.token,
    barber: dashboard.catalog.barbers.find((barber) => barber.id === entry.assignedBarberId)?.name ?? '',
    barberId: entry.assignedBarberId,
  }))
}

export function getNextFiveTokens(now = new Date()) {
  return getQueueDashboard(now).waiting.slice(0, 5).map((entry) => entry.token)
}

export function subscribeToQueueUpdates(listener) {
  const onStorage = (event) => {
    if (!event.key || event.key === QUEUE_STORAGE_KEY || event.key === CATALOG_STORAGE_KEY) listener(event)
  }
  window.addEventListener(QUEUE_UPDATED_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(QUEUE_UPDATED_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function createQueueRegistration(options) {
  return withLock(STATE_LOCK, () => {
    const now = options.now ? new Date(options.now) : new Date()
    const catalog = getSalonCatalog()
    const entries = currentEntries(now, catalog)
    const registration = registrationFromOptions(options, catalog, entries, now)
    writeEntries([...readEntries(), registration])
    return registration
  })
}

export function registerWalkIn(options) {
  return createQueueRegistration({ ...options, source: 'WALK_IN' })
}

export function callNextCustomer({ now: suppliedNow = new Date(), actor = 'RECEPTION' } = {}) {
  return withLock(STATE_LOCK, () => {
    const now = new Date(suppliedNow)
    const catalog = getSalonCatalog()
    const entries = currentEntries(now, catalog)
    const result = getNextCallableEntry(entries, catalog)
    if (!result.entry) throw new Error(result.blocked.length ? 'queue.noEligibleCustomer' : 'queue.noWaitingCustomers')
    const updatedEntry = addEvent({
      ...result.entry,
      assignedBarberId: result.barber.id,
      calledAt: now.toISOString(),
    }, 'Called', now, actor, { assignedBarberId: result.barber.id })
    const allEntries = readEntries().map((entry) => entry.id === updatedEntry.id ? updatedEntry : entry)
    writeEntries(allEntries)
    return updatedEntry
  })
}

export function callQueueCustomer(entryId, { barberId = null, now: suppliedNow = new Date(), actor = 'RECEPTION' } = {}) {
  return withLock(STATE_LOCK, () => {
    const now = new Date(suppliedNow)
    const catalog = getSalonCatalog()
    const allEntries = readEntries()
    const entry = findEntry(allEntries, entryId)
    if (entry.status !== 'Waiting') throw new Error('queue.customerNotWaiting')
    const dayEntries = currentEntries(now, catalog)
    let barber
    if (barberId && entry.barberPreference?.kind === 'SPECIFIC' && barberId !== entry.barberPreference.barberId) {
      throw new Error('queue.barberPreferenceConflict')
    }
    if (barberId && entry.barberPreference?.kind === 'ANY') {
      const candidate = catalog.barbers.find((item) => item.id === barberId && item.active && item.availability === 'AVAILABLE')
      const currentAssignment = dayEntries.some((item) => (item.status === 'Called' || item.status === 'In Chair') && item.assignedBarberId === barberId)
      if (!candidate || currentAssignment) throw new Error('queue.barberUnavailable')
      barber = candidate
    } else {
      const assignment = getBarberAssignment(entry, dayEntries, catalog)
      if (!assignment.barber) throw new Error(assignment.reason)
      barber = assignment.barber
    }
    const updatedEntry = addEvent({ ...entry, assignedBarberId: barber.id, calledAt: now.toISOString() }, 'Called', now, actor, { assignedBarberId: barber.id })
    writeEntries(allEntries.map((item) => item.id === entry.id ? updatedEntry : item))
    return updatedEntry
  })
}

export function startQueueService(entryId, barberId, now = new Date()) {
  return withLock(STATE_LOCK, () => {
    const startedAt = new Date(now)
    const catalog = getSalonCatalog()
    const allEntries = readEntries()
    const entry = findEntry(allEntries, entryId)
    const barber = catalog.barbers.find((item) => item.id === barberId && item.active)
    if (!barber) throw new Error('queue.barberUnavailable')
    if (barber.availability !== 'AVAILABLE') throw new Error('queue.barberOnBreak')
    if (entry.status !== 'Called') throw new Error('queue.customerNotCalled')
    if (entry.assignedBarberId !== barberId) throw new Error('queue.barberPreferenceConflict')
    const alreadyServing = allEntries.some((item) => item.id !== entryId && item.status === 'In Chair' && item.assignedBarberId === barberId)
    if (alreadyServing) throw new Error('queue.barberAlreadyServing')
    const updatedEntry = addEvent({ ...entry, startedAt: startedAt.toISOString() }, 'In Chair', startedAt, 'BARBER')
    writeEntries(allEntries.map((item) => item.id === entryId ? updatedEntry : item))
    return updatedEntry
  })
}

export function completeQueueService(entryId, barberId, now = new Date()) {
  return withLock(STATE_LOCK, () => {
    const completedAt = new Date(now)
    const entries = readEntries()
    const entry = findEntry(entries, entryId)
    if (entry.status !== 'In Chair') throw new Error('queue.customerNotInChair')
    if (entry.assignedBarberId !== barberId) throw new Error('queue.barberPreferenceConflict')
    const updatedEntry = addEvent({ ...entry, completedAt: completedAt.toISOString() }, 'Done', completedAt, 'BARBER')
    writeEntries(entries.map((item) => item.id === entryId ? updatedEntry : item))
    return updatedEntry
  })
}

export function cancelQueueRegistration(entryId, reason = '', actor = 'CUSTOMER', now = new Date()) {
  return withLock(STATE_LOCK, () => {
    const cancelledAt = new Date(now)
    const entries = readEntries()
    const entry = findEntry(entries, entryId)
    if (entry.status !== 'Waiting') throw new Error('queue.onlyWaitingCanCancel')
    const updatedEntry = addEvent({ ...entry, cancelledAt: cancelledAt.toISOString(), cancellationReason: reason.trim() }, 'Cancelled', cancelledAt, actor, { reason: reason.trim() })
    writeEntries(entries.map((item) => item.id === entryId ? updatedEntry : item))
    return updatedEntry
  })
}

export function markQueueNoShow(entryId, now = new Date()) {
  return withLock(STATE_LOCK, () => {
    const markedAt = new Date(now)
    const entries = readEntries()
    const entry = findEntry(entries, entryId)
    if (entry.status !== 'Called' || !entry.calledAt) throw new Error('queue.customerNotCalled')
    if (getEngineNoShowRemainingMs(entry, markedAt) > 0) throw new Error('queue.noShowTooEarly')
    const updatedEntry = addEvent({ ...entry, assignedBarberId: null, noShowAt: markedAt.toISOString() }, 'No-show', markedAt, 'RECEPTION')
    writeEntries(entries.map((item) => item.id === entryId ? updatedEntry : item))
    return updatedEntry
  })
}

export function getNoShowRemainingMs(entry, now = new Date()) {
  return getEngineNoShowRemainingMs(entry, now)
}

export function canMarkQueueNoShow(entry, now = new Date()) {
  return getNoShowRemainingMs(entry, now) === 0
}

export function setBarberAvailability(barberId, availability) {
  if (!['AVAILABLE', 'ON_BREAK', 'UNAVAILABLE'].includes(availability)) throw new Error('validation.availabilityInvalid')
  return updateSalonCatalog((catalog) => {
    const barber = catalog.barbers.find((item) => item.id === barberId)
    if (!barber) throw new Error('queue.barberMissing')
    const assigned = readEntries().some((entry) =>
      (entry.status === 'Called' || entry.status === 'In Chair') && entry.assignedBarberId === barberId,
    )
    if (availability !== 'AVAILABLE' && assigned) throw new Error('queue.barberHasActiveCustomer')
    return { ...catalog, barbers: catalog.barbers.map((item) => item.id === barberId ? { ...item, availability } : item) }
  })
}

export function updateSalonCatalog(updater) {
  return withLock(STATE_LOCK, () => {
    const current = readCatalog()
    const next = updater(clone(current))
    if (!next || typeof next !== 'object') throw new Error('validation.settingsInvalid')
    writeCatalog(next)
    return next
  })
}

export function createService(service) {
  return updateSalonCatalog((catalog) => ({
    ...catalog,
    services: [...catalog.services, { ...service, id: service.id ?? window.crypto.randomUUID(), active: true }],
  }))
}

export function updateService(serviceId, patch) {
  return updateSalonCatalog((catalog) => ({
    ...catalog,
    services: catalog.services.map((service) => service.id === serviceId ? { ...service, ...patch, id: serviceId } : service),
  }))
}

export function deleteService(serviceId) {
  return updateSalonCatalog((catalog) => {
    const isReferenced = readEntries().some((entry) => entry.services?.some((service) => service.serviceId === serviceId))
    return {
      ...catalog,
      services: isReferenced
        ? catalog.services.map((service) => service.id === serviceId ? { ...service, active: false } : service)
        : catalog.services.filter((service) => service.id !== serviceId),
    }
  })
}

export function createBarber(barber) {
  return updateSalonCatalog((catalog) => ({
    ...catalog,
    barbers: [...catalog.barbers, { ...barber, id: barber.id ?? window.crypto.randomUUID(), active: true, availability: barber.availability ?? 'AVAILABLE' }],
  }))
}

export function updateBarber(barberId, patch) {
  return updateSalonCatalog((catalog) => ({
    ...catalog,
    barbers: catalog.barbers.map((barber) => {
      if (barber.id !== barberId) return barber
      if ((patch.availability && patch.availability !== 'AVAILABLE') || patch.active === false) {
        const assigned = readEntries().some((entry) => (entry.status === 'Called' || entry.status === 'In Chair') && entry.assignedBarberId === barberId)
        if (assigned) throw new Error('queue.barberHasActiveCustomer')
      }
      return { ...barber, ...patch, id: barberId }
    }),
  }))
}

export function deleteBarber(barberId) {
  return updateSalonCatalog((catalog) => {
    const entries = readEntries()
    const hasActiveAssignment = entries.some((entry) => (entry.status === 'Called' || entry.status === 'In Chair') && entry.assignedBarberId === barberId)
    if (hasActiveAssignment) throw new Error('queue.barberHasActiveCustomer')
    const isReferenced = entries.some((entry) => entry.barberPreference?.barberId === barberId || entry.assignedBarberId === barberId)
    return {
      ...catalog,
      barbers: isReferenced
        ? catalog.barbers.map((barber) => barber.id === barberId ? { ...barber, active: false, availability: 'UNAVAILABLE' } : barber)
        : catalog.barbers.filter((barber) => barber.id !== barberId),
    }
  })
}

export function updateSalonHours(hours, cutoffMinutes) {
  const cutoff = Number(cutoffMinutes)
  if (cutoffMinutes !== undefined && (!Number.isInteger(cutoff) || cutoff < 0 || cutoff > 180)) throw new Error('validation.cutoffInvalid')
  return updateSalonCatalog((catalog) => ({ ...catalog, hours: { ...catalog.hours, ...hours }, ...(cutoffMinutes === undefined ? {} : { onlineCutoffMinutes: cutoff }) }))
}

export function updateOnlineCutoff(minutes) {
  const cutoff = Number(minutes)
  if (!Number.isInteger(cutoff) || cutoff < 0 || cutoff > 180) throw new Error('validation.cutoffInvalid')
  return updateSalonCatalog((catalog) => ({ ...catalog, onlineCutoffMinutes: cutoff }))
}

export function updateQueueControl(control, value) {
  if (!['onlinePaused', 'walkInsPaused'].includes(control)) throw new Error('validation.queueControlInvalid')
  return updateSalonCatalog((catalog) => ({
    ...catalog,
    queueControls: { ...catalog.queueControls, [control]: Boolean(value) },
  }))
}

export function getDailySalonStatistics(now = new Date()) {
  const catalog = getSalonCatalog()
  return getDailyStatistics(currentEntries(now, catalog), catalog, now)
}

export function getNextCustomerForBarber(barberId, now = new Date()) {
  const dashboard = getQueueDashboard(now)
  if (!dashboard.barbers.some((barber) => barber.id === barberId && barber.effectiveAvailability === 'AVAILABLE')) return null
  const waiting = [...dashboard.waiting].sort((left, right) => left.queueOrder - right.queueOrder)
  for (const entry of waiting) {
    const assignment = getBarberAssignment(entry, dashboard.entries, dashboard.catalog)
    if (assignment.barber?.id === barberId) return entry
  }
  return null
}
