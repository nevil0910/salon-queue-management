import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { Card } from '../ui/Card.jsx'
import { getStaffIdentity, refreshStaffState, staffLogin } from '../../lib/queueRepository.js'
import { clearStaffSession, getStaffSession } from '../../lib/api.js'

const roleRoutes = { OWNER: '/manage/admin', RECEPTION: '/manage/receptionist', BARBER: '/manage/barber' }

export function StaffAccess({ children, redirectByRole = false }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
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

  useEffect(() => {
    if (!redirectByRole || !session || checking || !identity) return
    const target = roleRoutes[identity.role]
    if (target && location.pathname !== target) navigate(target, { replace: true })
  }, [checking, identity, location.pathname, navigate, redirectByRole, session])

  if (session && checking) return <main className="staff-access"><Card><p role="status">{t('common.loading')}</p></Card></main>
  if (session && identity && redirectByRole && location.pathname !== roleRoutes[identity.role]) return <main className="staff-access"><Card><p role="status">{t('common.loading')}</p></Card></main>
  if (session && identity) return children
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    const data = new FormData(event.currentTarget)
    try {
      const user = await staffLogin(data.get('email'), data.get('password'))
      setIdentity(user)
      setSession(getStaffSession())
    }
    catch (e) { setError(e.message || 'auth.invalidCredentials') }
    finally { setBusy(false) }
  }
  return <main className="staff-access"><Card><p className="eyebrow">{t('auth.staff')}</p><h1>{t('auth.loginTitle')}</h1><form onSubmit={submit}><label className="field"><span>{t('auth.email')}</span><input name="email" type="email" autoComplete="username" required /></label><label className="field"><span>{t('auth.password')}</span><input name="password" type="password" autoComplete="current-password" required /></label>{error&&<p role="alert">{t(error)}</p>}<button className="button button--primary" disabled={busy}>{t('auth.login')}</button></form></Card></main>
}
