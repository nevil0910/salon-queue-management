import { ArrowRight, Check, Clock3, Coffee, Scissors, UserRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '../components/ui/Card.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { formatCount, formatDuration } from '../lib/formatters.js'
import { completeQueueService, getNextCustomerForBarber, getQueueDashboard, setBarberAvailability, startQueueService, subscribeToQueueUpdates } from '../lib/queueRepository.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

function localized(value, language) { return typeof value === 'string' ? value : value?.[language] ?? '' }
function slug(value) { return String(value ?? '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-') }

export function BarberView() {
  const { name } = useParams()
  const { language, t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const [dashboard, setDashboard] = useState(() => getQueueDashboard())
  const [now, setNow] = useState(() => new Date())
  const [notice, setNotice] = useState('')
  const [errorKey, setErrorKey] = useState('')

  const refresh = useCallback(() => { setDashboard(getQueueDashboard()); setNow(new Date()) }, [])
  useEffect(() => {
    refresh()
    const unsubscribe = subscribeToQueueUpdates(refresh)
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => { unsubscribe(); window.clearInterval(timer) }
  }, [refresh])

  const barber = useMemo(() => dashboard.barbers.find((item) =>
    item.id === name || slug(localized(item.name, language)) === String(name ?? '').toLocaleLowerCase(),
  ) ?? dashboard.barbers.find((item) => item.active), [dashboard.barbers, language, name])
  const activeCustomer = dashboard.entries.find((entry) =>
    entry.assignedBarberId === barber?.id && (entry.status === 'Called' || entry.status === 'In Chair'),
  ) ?? null
  const nextCustomer = barber ? getNextCustomerForBarber(barber.id, now) : null
  const status = barber?.effectiveAvailability ?? 'UNAVAILABLE'
  const serviceDuration = activeCustomer ? activeCustomer.services.reduce((sum, service) => sum + service.durationMinutes, 0) : 0
  const elapsedSeconds = activeCustomer?.startedAt ? Math.max(0, Math.floor((now.getTime() - new Date(activeCustomer.startedAt).getTime()) / 1000)) : 0
  const remainingSeconds = Math.max(0, serviceDuration * 60 - elapsedSeconds)
  const clock = (seconds) => `${formatCount(Math.floor(seconds / 60), language).padStart(2, '0')}:${formatCount(seconds % 60, language).padStart(2, '0')}`

  async function run(action, successKey) {
    setErrorKey('')
    setNotice('')
    try { await action(); setNotice(successKey); refresh() }
    catch (error) { setErrorKey(error?.message || 'validation.storageUnavailable') }
  }

  if (!barber) return <PageContainer className="inner-page staff-page"><PageHeader eyebrow="barber.eyebrow" title={t('barber.title')} description={t('barber.noCustomer')} /></PageContainer>

  return (
    <PageContainer className="inner-page staff-page barber-page">
      <PageHeader eyebrow="barber.eyebrow" title={localized(barber.name, language)} description={t('barber.description')} />
      <div className="staff-local-note"><span className="preview-notice__dot" />{t('reception.localNotice')}</div>
      <Card className="barber-control-card">
        <div className="barber-control-card__top"><div className="barber-identity"><span className="barber-identity__mark"><Scissors size={23} /></span><div><p className="eyebrow">{t('barber.availability')}</p><h2>{localized(barber.name, language)}</h2></div></div><span className={`availability-pill availability-pill--${status.toLowerCase().replace('_', '-')}`}><i />{t(status === 'AVAILABLE' ? 'barber.available' : status === 'ON_BREAK' ? 'barber.onBreak' : status === 'CALLED' ? 'queue.called' : status === 'SERVING' ? 'barber.serving' : 'barber.unavailable')}</span></div>
        <div className="barber-work-grid">
          <section className="barber-customer-panel" aria-live="polite">
            <div className="barber-panel-heading"><p className="eyebrow"><UserRound size={13} />{t('barber.currentCustomer')}</p>{activeCustomer && <span className="queue-token-chip">{activeCustomer.token}</span>}</div>
            {activeCustomer ? <AnimatePresence mode="wait" initial={false}><motion.div key={activeCustomer.id} className="barber-current-customer" initial={reduceMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .2 }}>
              <h3>{activeCustomer.customer.displayName}</h3>
              {activeCustomer.status === 'Called' && <p className="barber-called-note">{t('barber.calledCustomer')}</p>}
              <ul className="barber-service-list">{activeCustomer.services.map((service) => <li key={service.serviceId}><span>{service.nameSnapshot}</span><span>{formatDuration(service.durationMinutes, language, t)}</span></li>)}</ul>
              <div className={`service-timer${activeCustomer.status === 'In Chair' ? ' is-running' : ''}`}><Clock3 size={17} /><div><span>{t('barber.timer')}</span><strong>{activeCustomer.status === 'In Chair' ? clock(elapsedSeconds) : clock(serviceDuration * 60)}</strong></div><small>{activeCustomer.status === 'In Chair' ? `${t('barber.duration')}: ${clock(remainingSeconds)}` : t('barber.duration')}</small></div>
              <div className="barber-action-row">{activeCustomer.status === 'Called' && <button className="button button--primary" type="button" onClick={() => run(() => startQueueService(activeCustomer.id, barber.id), 'barber.serviceStarted')}>{t('barber.startService')} <ArrowRight size={15} /></button>}{activeCustomer.status === 'In Chair' && <button className="button button--primary" type="button" onClick={() => run(() => completeQueueService(activeCustomer.id, barber.id), 'barber.serviceCompleted')}><Check size={15} />{t('barber.completeService')}</button>}</div>
            </motion.div></AnimatePresence> : <div className="barber-empty-customer"><span><UserRound size={24} /></span><p>{t('barber.noCustomer')}</p></div>}
          </section>
          <aside className="barber-side-panel">
            <div className="barber-availability-actions"><p className="eyebrow"><Coffee size={13} />{t('barber.availability')}</p>{status === 'ON_BREAK' ? <button className="button button--secondary" type="button" onClick={() => run(() => setBarberAvailability(barber.id, 'AVAILABLE'), 'barber.breakEnded')}>{t('barber.endBreak')}</button> : <button className="button button--secondary" type="button" disabled={Boolean(activeCustomer)} title={activeCustomer ? t('barber.activeCustomerWarning') : undefined} onClick={() => run(() => setBarberAvailability(barber.id, 'ON_BREAK'), 'barber.breakStarted')}>{t('barber.startBreak')}</button>}</div>
            {activeCustomer && <p className="barber-action-hint">{t('barber.activeCustomerWarning')}</p>}
            <div className="barber-next-panel"><p className="eyebrow">{t('barber.nextWaiting')}</p>{nextCustomer ? <div className="barber-next-token"><span>{nextCustomer.token}</span><small>{nextCustomer.barberPreference.kind === 'ANY' ? t('queue.anyBarber') : localized(nextCustomer.barberPreference.barberNameSnapshot, language)}</small></div> : <p>{t('barber.noNext')}</p>}</div>
          </aside>
        </div>
      </Card>
      <AnimatePresence>{(notice || errorKey) && <motion.div className={`staff-toast${errorKey ? ' staff-toast--error' : ''}`} role={errorKey ? 'alert' : 'status'} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0 }}>{t(errorKey || notice)}<button type="button" onClick={() => { setErrorKey(''); setNotice('') }} aria-label={t('dialog.dismiss')}>×</button></motion.div>}</AnimatePresence>
    </PageContainer>
  )
}
