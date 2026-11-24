const API_ROOT = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '')
const STAFF_SESSION_KEY = 'elite.staff.session'

export function getStaffSession() { return window.sessionStorage.getItem(STAFF_SESSION_KEY) }
export function setStaffSession(token) { window.sessionStorage.setItem(STAFF_SESSION_KEY, token); window.dispatchEvent(new Event('elite:staff-session-changed')) }
export function clearStaffSession() { window.sessionStorage.removeItem(STAFF_SESSION_KEY); window.dispatchEvent(new Event('elite:staff-session-changed')) }

export async function api(path, options = {}) {
  const token = getStaffSession()
  const response = await fetch(`${API_ROOT}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    credentials: 'omit',
  })
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload?.error ?? 'api.requestFailed')
    error.status = response.status
    error.details = payload?.details
    if (response.status === 401) clearStaffSession()
    throw error
  }
  return payload
}
