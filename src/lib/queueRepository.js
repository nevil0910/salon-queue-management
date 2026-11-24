import { api, getStaffSession, setStaffSession, clearStaffSession } from './api.js'
import { getBarberAssignment, getNoShowRemainingMs as engineNoShowRemainingMs } from './queueEngine.js'

export const QUEUE_UPDATED_EVENT = 'elite:queue-updated'
let dashboardCache = null
let catalogCache = null
let snapshotCache = null
let eventSource
let listeners = new Set()

const emit = () => { for (const listener of listeners) listener() }
const apiRoot = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '')

export async function refreshPublicState() {
  const [catalog, dashboard, snapshot] = await Promise.all([
    api('/api/public/catalog'), api('/api/public/dashboard'), api('/api/public/snapshot'),
  ])
  catalogCache = catalog
  dashboardCache = dashboard
  snapshotCache = snapshot
  emit()
  return dashboard
}

export async function refreshStaffState() {
  const dashboard = await api('/api/staff/dashboard')
  dashboardCache = dashboard
  catalogCache = dashboard.catalog
  emit()
  return dashboard
}

export function subscribeToQueueUpdates(listener) {
  listeners.add(listener)
  if (!eventSource && typeof window !== 'undefined') {
    eventSource = new EventSource(`${apiRoot}/api/events`)
    eventSource.addEventListener('queue-updated', emit)
    eventSource.onerror = () => { /* periodic refetch remains active on each screen */ }
  }
  return () => listeners.delete(listener)
}

export function getSalonCatalog() { return catalogCache }
export function getQueueDashboard() { return dashboardCache }
export function getCurrentServing() { return dashboardCache?.inChair ?? [] }
export function getNextFiveTokens() { return dashboardCache?.waiting.slice(0, 5) ?? [] }
export function getNoShowRemainingMs(entry, now) { return engineNoShowRemainingMs(entry, now) }
export function canMarkQueueNoShow(entry, now) { return getNoShowRemainingMs(entry, now) === 0 }
export function getNextCustomerForBarber(barberId) {
  if (!dashboardCache || !catalogCache) return null
  const dashboard = dashboardCache
  if (!dashboard.barbers.some((barber) => barber.id === barberId && barber.effectiveAvailability === 'AVAILABLE')) return null
  return dashboard.waiting.find((entry) => getBarberAssignment(entry, dashboard.entries, dashboard.catalog).barber?.id === barberId) ?? null
}

export async function getSalonSnapshot() {
  if (!snapshotCache) await refreshPublicState()
  return snapshotCache
}
export function getSalonSnapshotCached() { return snapshotCache }

export async function getQueueDashboardAsync() {
  return getStaffSession() ? refreshStaffState() : refreshPublicState()
}
export async function getRegistrationStatusAsync(token) { return api(`/api/customer/status/${encodeURIComponent(token)}`) }
export async function cancelCustomerStatus(token, reason) { const result=await api(`/api/customer/status/${encodeURIComponent(token)}/cancel`,{method:'POST',body:{reason}});return result }

export async function createQueueRegistration(options) {
  const result = await api('/api/public/registrations', { method: 'POST', body: options })
  await refreshPublicState()
  return result
}
export async function registerWalkIn(options) {
  const result = await api('/api/staff/registrations', { method: 'POST', body: options })
  await refreshStaffState()
  return result
}
export async function callNextCustomer() { const result = await api('/api/staff/queue/call-next', { method: 'POST', body: {} }); await refreshStaffState(); return result }
export async function callQueueCustomer(id) { const result = await api(`/api/staff/queue/${id}/call`, { method: 'POST', body: {} }); await refreshStaffState(); return result }
export async function startQueueService(id) { const result = await api(`/api/staff/queue/${id}/start`, { method: 'POST', body: {} }); await refreshStaffState(); return result }
export async function completeQueueService(id) { const result = await api(`/api/staff/queue/${id}/complete`, { method: 'POST', body: {} }); await refreshStaffState(); return result }
export async function cancelQueueRegistration(id, reason, actor = 'CUSTOMER') {
  const result = await api(`/api/staff/queue/${id}/cancel`, { method: 'POST', body: { reason } })
  await refreshStaffState()
  return result
}
export async function markQueueNoShow(id) { const result = await api(`/api/staff/queue/${id}/no-show`, { method: 'POST', body: {} }); await refreshStaffState(); return result }
export async function setBarberAvailability(id, availability) { const result = await api(`/api/staff/barbers/${id}`, { method: 'PATCH', body: { availability } }); await refreshStaffState(); return result }

export async function createService(service) { const result = await api('/api/owner/services', { method: 'POST', body: service }); await refreshStaffState(); return result }
export async function updateService(id, patch) { const result = await api(`/api/owner/services/${id}`, { method: 'PATCH', body: patch }); await refreshStaffState(); return result }
export async function deleteService(id) { const result = await api(`/api/owner/services/${id}`, { method: 'DELETE' }); await refreshStaffState(); return result }
export async function createBarber(barber) { const result = await api('/api/owner/barbers', { method: 'POST', body: barber }); await refreshStaffState(); return result }
export async function updateBarber(id, patch) { const result = await api(`/api/owner/barbers/${id}`, { method: 'PATCH', body: patch }); await refreshStaffState(); return result }
export async function deleteBarber(id) { const result = await api(`/api/owner/barbers/${id}`, { method: 'DELETE' }); await refreshStaffState(); return result }
export async function updateSalonHours(hours, cutoffMinutes) { const result = await api('/api/owner/settings', { method: 'PATCH', body: { hours, onlineCutoffMinutes: Number(cutoffMinutes) } }); await refreshStaffState(); return result }
export async function updateQueueControl(control, value) { const result = await api('/api/owner/settings', { method: 'PATCH', body: { queueControls: { [control]: Boolean(value) } } }); await refreshStaffState(); return result }

export async function staffLogin(email, password) { const result = await api('/api/auth/login', { method: 'POST', body: { email, password } }); setStaffSession(result.token); await refreshStaffState(); return result.user }
export async function getStaffIdentity() { return api('/api/auth/session') }
export async function staffLogout() { try { await api('/api/auth/logout', { method: 'POST' }) } finally { clearStaffSession(); dashboardCache = catalogCache = null; emit() } }
export async function provisionStaffAccount(account) { return api('/api/owner/staff', { method: 'POST', body: account }) }

