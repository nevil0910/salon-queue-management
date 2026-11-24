const STORAGE_KEY = 'elite.queue.entries.v1'
const ACTIVE_STATUSES = new Set(['Waiting', 'Called', 'In Chair'])

function localOperatingDayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readEntries() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    throw new Error('queue.storageUnavailable')
  }
}

function writeEntries(entries) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    window.dispatchEvent(new CustomEvent('elite:queue-updated'))
  } catch {
    throw new Error('queue.storageUnavailable')
  }
}

export function normalizePhone(phone) {
  return String(phone ?? '').replace(/\D/g, '')
}

export function getQueueEntries({ salonId = 'elite-primary', operatingDayKey = localOperatingDayKey() } = {}) {
  return readEntries()
    .filter((entry) => entry.salonId === salonId && entry.operatingDayKey === operatingDayKey)
    .sort((left, right) => left.queueOrder - right.queueOrder)
}

export function getActiveQueueEntries(options) {
  return getQueueEntries(options).filter((entry) => ACTIVE_STATUSES.has(entry.status))
}

export function subscribeToQueueUpdates(listener) {
  window.addEventListener('elite:queue-updated', listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener('elite:queue-updated', listener)
    window.removeEventListener('storage', listener)
  }
}

function buildRegistration({ customerName, phone, selectedServices, barberPreference, catalog, language = 'en', salonId, operatingDayKey }) {
  const name = String(customerName ?? '').trim()
  const normalizedPhone = normalizePhone(phone)
  if (!name) throw new Error('validation.nameRequired')
  if (normalizedPhone.length < 7 || normalizedPhone.length > 15) throw new Error('validation.phoneInvalid')
  if (!Array.isArray(selectedServices) || selectedServices.length === 0) throw new Error('validation.serviceRequired')
  if (!['ANY', 'SPECIFIC'].includes(barberPreference?.kind) || (barberPreference.kind === 'SPECIFIC' && !barberPreference.barberId)) {
    throw new Error('validation.barberRequired')
  }

  const entries = readEntries()
  const duplicate = entries.find((entry) =>
    entry.salonId === salonId &&
    entry.operatingDayKey === operatingDayKey &&
    entry.normalizedPhone === normalizedPhone &&
    ACTIVE_STATUSES.has(entry.status),
  )
  if (duplicate) throw new Error('validation.duplicatePhone')

  const serviceSnapshots = selectedServices.map((serviceId) => {
    const service = catalog.services.find((item) => item.id === serviceId && item.active)
    if (!service) throw new Error('validation.serviceUnavailable')
    return {
      serviceId: service.id,
      nameSnapshot: typeof service.name === 'string' ? service.name : service.name[language],
      priceMinorUnits: service.priceMinorUnits,
      durationMinutes: service.durationMinutes,
    }
  })
  const eligibleBarber = barberPreference.kind === 'ANY'
    ? null
    : catalog.barbers.find((barber) => barber.id === barberPreference.barberId && barber.active && barber.availability === 'AVAILABLE')
  if (barberPreference.kind === 'SPECIFIC' && !eligibleBarber) throw new Error('validation.barberUnavailable')

  const todayEntries = entries.filter((entry) => entry.salonId === salonId && entry.operatingDayKey === operatingDayKey)
  const latestSequence = todayEntries.reduce((current, entry) => Math.max(current, Number(entry.tokenSequence) || 0), 0)
  const queueOrder = todayEntries.reduce((current, entry) => Math.max(current, Number(entry.queueOrder) || 0), 0) + 1
  const id = window.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const registration = {
    id,
    salonId,
    operatingDayKey,
    tokenSequence: latestSequence + 1,
    token: `E-${String(latestSequence + 1).padStart(3, '0')}`,
    queueOrder,
    customer: { displayName: name, phone: String(phone).trim() },
    normalizedPhone,
    services: serviceSnapshots,
    barberPreference: barberPreference.kind === 'ANY'
      ? { kind: 'ANY', barberId: null }
      : {
        kind: 'SPECIFIC',
        barberId: eligibleBarber.id,
        barberNameSnapshot: typeof eligibleBarber.name === 'string' ? eligibleBarber.name : eligibleBarber.name[language],
      },
    assignedBarberId: null,
    status: 'Waiting',
    createdAt: new Date().toISOString(),
    estimatedWaitingMinutes: null,
    storageMode: 'local-preview',
  }

  return { entries, registration }
}

function createAndPersistRegistration(options) {
  const salonId = options.salonId ?? 'elite-primary'
  const operatingDayKey = options.operatingDayKey ?? localOperatingDayKey()
  const { entries, registration } = buildRegistration({ ...options, salonId, operatingDayKey })
  writeEntries([...entries, registration])
  return registration
}

export function createQueueRegistration(options) {
  const run = () => createAndPersistRegistration(options)
  if (navigator.locks?.request) return navigator.locks.request(STORAGE_KEY, run)
  return Promise.resolve().then(run)
}

export function getRegistrationById(id) {
  return readEntries().find((entry) => entry.id === id) ?? null
}
