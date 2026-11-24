import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { Card } from '../ui/Card.jsx'
import { getStaffIdentity, refreshStaffState, staffLogin } from '../../lib/queueRepository.js'
import { clearStaffSession, getStaffSession } from '../../lib/api.js'

export function StaffAccess({ children, allowedRoles = [], barberOnly = false }) {
  const { t } = useLanguage()
  const { name: routeBarberId } = useParams()
  const [session, setSession] = useState(getStaffSession())
  const [identity, setIdentity] = useState(null)
  const [checking, setChecking] = useState(Boolean(getStaffSession()))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!session) { setIdentity(null); setChecking(false); return }
    let active = true
    setChecking(true)
    Promise.all([getStaffIdentity(), refreshStaffState()])
      .then(([user]) => { if (active) setIdentity(user) })
      .catch(() => { if (active) { clearStaffSession(); setSession(null); setIdentity(null) } })
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [session])

  const roleAllowed = identity && allowedRoles.includes(identity.role)
  const barberAllowed = !barberOnly || identity?.role !== 'BARBER' || identity.barberId === routeBarberId
  if (session && checking) return <main className="staff-access"><Card><p role="status">{t('common.loading')}</p></Card></main>
  if (session && roleAllowed && barberAllowed) return children
  if (session && identity) return <main className="staff-access"><Card><p className="eyebrow">{t('auth.staff')}</p><p role="alert">{t('auth.forbidden')}</p></Card></main>
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    const data = new FormData(event.currentTarget)
    try {
      const user = await staffLogin(data.get('email'), data.get('password'))
      setIdentity(user)
      setSession(getStaffSession())
      if (!allowedRoles.includes(user.role) || (barberOnly && user.role === 'BARBER' && user.barberId !== routeBarberId)) setError('auth.forbidden')
    }
    catch (e) { setError(e.message || 'auth.invalidCredentials') }
    finally { setBusy(false) }
  }
  return <main className="staff-access"><Card><p className="eyebrow">{t('auth.staff')}</p><h1>{t('auth.loginTitle')}</h1><form onSubmit={submit}><label className="field"><span>{t('auth.email')}</span><input name="email" type="email" autoComplete="username" required /></label><label className="field"><span>{t('auth.password')}</span><input name="password" type="password" autoComplete="current-password" required /></label>{error&&<p role="alert">{t(error)}</p>}<button className="button button--primary" disabled={busy}>{t('auth.login')}</button></form></Card></main>
}
