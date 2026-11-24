import { getQueueEntries } from './queueRepository.js'

function localTimeParts(date, timeZone) {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: timeZone === 'local' ? undefined : timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  return Object.fromEntries(formatted.map(({ type, value }) => [type, value]))
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function minutesFromClock(value) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

export function getSalonSnapshot(catalog, now = new Date()) {
  const parts = localTimeParts(now, catalog.timeZone)
  const dayNumber = now.getDay()
  const hours = catalog.hours[dayNumber] ?? null
  const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute)
  let status = 'CLOSED'
  let onlineJoiningOpen = false
  let minutesUntilClose = null

  if (hours) {
    const opensAt = minutesFromClock(hours.opensAt)
    const closesAt = minutesFromClock(hours.closesAt)
    if (currentMinutes < opensAt) {
      status = opensAt - currentMinutes <= 60 ? 'OPENING_SOON' : 'CLOSED'
    } else if (currentMinutes < closesAt) {
      minutesUntilClose = closesAt - currentMinutes
      status = minutesUntilClose <= 60 ? 'CLOSING_SOON' : 'OPEN'
      onlineJoiningOpen = currentMinutes < closesAt - 30
    }
  }

  const entries = getQueueEntries({ salonId: catalog.salonId, operatingDayKey: localDateKey(now) })
  const waitingCount = entries.filter((entry) => entry.status === 'Waiting').length
  const availableBarbers = catalog.barbers.filter((barber) => barber.active && barber.availability === 'AVAILABLE').length

  return {
    status,
    onlineJoiningOpen,
    minutesUntilClose,
    hours,
    waitingCount,
    availableBarbers,
    barbers: catalog.barbers,
    services: catalog.services.filter((service) => service.active),
    localDay: localDateKey(now),
    queueEntries: entries,
  }
}
