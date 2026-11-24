import { useEffect, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { Card } from '../ui/Card.jsx'
import { refreshStaffState, staffLogin } from '../../lib/queueRepository.js'
import { clearStaffSession, getStaffSession } from '../../lib/api.js'

export function StaffAccess({ children, ownerOnly = false }) {
  const { t } = useLanguage()
  const [session, setSession] = useState(getStaffSession())
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if(session)refreshStaffState().catch(()=>{clearStaffSession();setSession(null)}) }, [session])
  if (session) return children
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    const data = new FormData(event.currentTarget)
    try { const user=await staffLogin(data.get('email'), data.get('password')); if(ownerOnly&&user.role!=='OWNER'){clearStaffSession();throw new Error('auth.forbidden')} setSession(getStaffSession()) }
    catch (e) { setError(e.message || 'auth.invalidCredentials') }
    finally { setBusy(false) }
  }
  return <main className="staff-access"><Card><p className="eyebrow">{t('auth.staff')}</p><h1>{t('auth.loginTitle')}</h1><form onSubmit={submit}><label className="field"><span>{t('auth.email')}</span><input name="email" type="email" autoComplete="username" required /></label><label className="field"><span>{t('auth.password')}</span><input name="password" type="password" autoComplete="current-password" required /></label>{error&&<p role="alert">{t(error)}</p>}<button className="button button--primary" disabled={busy}>{t('auth.login')}</button></form></Card></main>
}
