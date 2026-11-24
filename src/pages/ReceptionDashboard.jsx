import { ArrowRight, Clock3, Search, UserPlus, UsersRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { formatCount, formatDuration, formatPrice } from '../lib/formatters.js'
import {
  callNextCustomer,
  callQueueCustomer,
  cancelQueueRegistration,
  canMarkQueueNoShow,
  getNoShowRemainingMs,
  getQueueDashboard,
  markQueueNoShow,
  registerWalkIn,
  subscribeToQueueUpdates,
  refreshStaffState,
} from '../lib/queueRepository.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const tabs = [
  { id: 'Waiting', key: 'reception.waiting' },
  { id: 'Called', key: 'reception.called' },
  { id: 'In Chair', key: 'reception.inChair' },
  { id: 'Done', key: 'reception.done' },
]

function localize(value, language) {
  return typeof value === 'string' ? value : value?.[language] ?? ''
}

function formatClock(value, language) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(language === 'gu' ? 'gu-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function formatCountdown(milliseconds, language) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  return new Intl.NumberFormat(language === 'gu' ? 'gu-IN' : 'en-IN', { minimumIntegerDigits: 2 }).format(Math.floor(seconds / 60)) + ':' + new Intl.NumberFormat(language === 'gu' ? 'gu-IN' : 'en-IN', { minimumIntegerDigits: 2 }).format(seconds % 60)
}

export function ReceptionDashboard() {
  const { language, t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const [dashboard, setDashboard] = useState(null)
  const [activeTab, setActiveTab] = useState('Waiting')
  const [query, setQuery] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [walkInName, setWalkInName] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInServices, setWalkInServices] = useState([])
  const [walkInBarber, setWalkInBarber] = useState('ANY')
  const [notice, setNotice] = useState('')
  const [errorKey, setErrorKey] = useState('')
  const [pendingAction, setPendingAction] = useState(null)

  const refresh = useCallback(() => { refreshStaffState().then(setDashboard).catch(() => {}); setNow(new Date()) }, [])
  useEffect(() => {
    refresh()
    const unsubscribe = subscribeToQueueUpdates(refresh)
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => { unsubscribe(); window.clearInterval(interval) }
  }, [refresh])

  const entriesForTab = useMemo(() => {
    if (!dashboard) return []
    const source = activeTab === 'Waiting' ? dashboard.waiting
      : activeTab === 'Called' ? dashboard.called
        : activeTab === 'In Chair' ? dashboard.inChair : dashboard.completed
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return source
    return source.filter((entry) => [entry.customer.displayName, entry.customer.phone, entry.token]
      .some((value) => String(value ?? '').toLocaleLowerCase().includes(normalizedQuery)))
  }, [activeTab, dashboard, query])

  const blockedById = useMemo(() => new Map((dashboard?.blocked ?? []).map((item) => [item.entry.id, item.reason])), [dashboard])
  const availableBarbers = (dashboard?.barbers ?? []).filter((barber) => barber.effectiveAvailability === 'AVAILABLE')
  if (!dashboard) return <PageContainer className="inner-page staff-page"><p role="status">{t('common.loading')}</p></PageContainer>

  async function safelyRun(action, successKey) {
    setErrorKey('')
    setNotice('')
    try {
      await action()
      setNotice(successKey)
      refresh()
    } catch (error) {
      setErrorKey(error?.message || 'validation.storageUnavailable')
    }
  }

  async function submitWalkIn(event) {
    event.preventDefault()
    setErrorKey('')
    setNotice('')
    if (!walkInName.trim()) { setErrorKey('validation.nameRequired'); return }
    if (walkInPhone.replace(/\D/g, '').length < 7 || walkInPhone.replace(/\D/g, '').length > 15) { setErrorKey('validation.phoneInvalid'); return }
    if (!walkInServices.length) { setErrorKey('validation.serviceRequired'); return }
    try {
      await registerWalkIn({
        customerName: walkInName,
        phone: walkInPhone,
        selectedServices: walkInServices,
        barberPreference: walkInBarber === 'ANY' ? { kind: 'ANY' } : { kind: 'SPECIFIC', barberId: walkInBarber },
        language,
      })
      setWalkInName('')
      setWalkInPhone('')
      setWalkInServices([])
      setWalkInBarber('ANY')
      setNotice('reception.walkInSuccess')
      setActiveTab('Waiting')
      refresh()
    } catch (error) {
      setErrorKey(error?.message || 'validation.storageUnavailable')
    }
  }

  const confirmPending = async () => {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)
    await safelyRun(action.run, action.successKey)
  }

  const statItems = [
    ['reception.waiting', dashboard.statistics.waiting, 'stat-card--jade'],
    ['reception.called', dashboard.statistics.called, ''],
    ['reception.inChair', dashboard.statistics.inChair, ''],
    ['reception.done', dashboard.statistics.completed, 'stat-card--copper'],
  ]

  return (
    <PageContainer className="inner-page staff-page reception-page">
      <PageHeader eyebrow="reception.eyebrow" title={t('reception.title')} description={t('reception.description')} actions={<Button onClick={() => safelyRun(() => callNextCustomer(), 'reception.called')} disabled={!dashboard.waiting.length || !dashboard.barbers.some((barber) => barber.effectiveAvailability === 'AVAILABLE')}><ArrowRight size={15} />{t('reception.callNext')}</Button>} />
      <div className="queue-stats-grid">{statItems.map(([labelKey, value, style]) => <Card className={`queue-stat-card ${style}`} key={labelKey}><span>{t(labelKey)}</span><strong>{formatCount(value, language)}</strong></Card>)}</div>
      <div className="reception-main-grid">
        <section className="reception-queue-column">
          <Card className="queue-board">
            <div className="queue-board__heading"><div><p className="eyebrow"><UsersRound size={14} />{t('reception.queue')}</p><h2>{t(tabs.find((tab) => tab.id === activeTab)?.key)}</h2></div><label className="queue-search"><Search size={16} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('reception.search')} aria-label={t('reception.search')} /></label></div>
            <div className="queue-tabs" role="tablist" aria-label={t('reception.queue')}>{tabs.map((tab) => <button type="button" role="tab" aria-selected={activeTab === tab.id} key={tab.id} className={activeTab === tab.id ? 'is-active' : ''} onClick={() => setActiveTab(tab.id)}>{t(tab.key)}<span>{formatCount(tab.id === 'Waiting' ? dashboard.waiting.length : tab.id === 'Called' ? dashboard.called.length : tab.id === 'In Chair' ? dashboard.inChair.length : dashboard.completed.length, language)}</span></button>)}</div>
            <div className="queue-table-wrap"><table className="queue-table"><thead><tr><th>{t('reception.customer')}</th><th>{t('reception.token')}</th><th>{t('reception.services')}</th><th>{t('reception.barber')}</th><th>{t('reception.wait')}</th><th>{t('reception.actions')}</th></tr></thead><tbody>
              <AnimatePresence initial={false} mode="popLayout">{entriesForTab.map((entry) => {
                const wait = dashboard.estimates[entry.id]
                const blockedReason = blockedById.get(entry.id)
                const noShowRemaining = getNoShowRemainingMs(entry, now)
                return <motion.tr key={entry.id} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .18 }}>
                  <td><strong>{entry.customer.displayName}</strong><small>{entry.customer.phone}</small></td><td><span className="queue-token-chip">{entry.token}</span></td>
                  <td><span className="queue-service-preview">{entry.services.map((service) => service.nameSnapshot).join(', ')}</span></td>
                  <td>{entry.barberPreference.kind === 'ANY' ? t('queue.anyBarber') : entry.barberPreference.barberNameSnapshot}</td>
                  <td>{entry.status === 'Waiting' ? wait === null || wait === undefined ? t('reception.unknownWait') : formatDuration(wait, language, t) : entry.calledAt ? formatClock(entry.calledAt, language) : '—'}</td>
                  <td><div className="queue-row-actions">
                    {entry.status === 'Waiting' && <><button type="button" className="table-action table-action--primary" disabled={Boolean(blockedReason)} title={blockedReason ? t(blockedReason) : undefined} onClick={() => safelyRun(() => callQueueCustomer(entry.id), 'reception.called')}>{t('reception.callManual')}</button><button type="button" className="table-action" onClick={() => setPendingAction({ title: t('reception.confirmCancel'), run: () => cancelQueueRegistration(entry.id, t('reception.cancelReason'), 'RECEPTION'), successKey: 'status.cancelSuccess' })}>{t('reception.cancelAction')}</button>{blockedReason && <small className="row-blocked-reason">{t(blockedReason)}</small>}</>}
                    {entry.status === 'Called' && <button type="button" className="table-action table-action--warning" disabled={!canMarkQueueNoShow(entry, now)} title={noShowRemaining ? `${t('reception.noShowAfter')} ${formatCountdown(noShowRemaining, language)}` : undefined} onClick={() => setPendingAction({ title: t('reception.confirmNoShow'), run: () => markQueueNoShow(entry.id), successKey: 'queue.noShow' })}>{canMarkQueueNoShow(entry, now) ? t('reception.noShowAction') : `${t('reception.noShowAfter')} ${formatCountdown(noShowRemaining ?? 0, language)}`}</button>}
                    {entry.status === 'In Chair' && <span className="row-live-state">{t('reception.servingNow')}</span>}
                    {entry.status === 'Done' && entry.completedAt && <span className="row-live-state">{formatClock(entry.completedAt, language)}</span>}
                  </div></td>
                </motion.tr>
              })}</AnimatePresence>
              {!entriesForTab.length && <tr><td colSpan="6" className="queue-table-empty">{query ? t('reception.noResults') : t('reception.noWaiting')}</td></tr>}
            </tbody></table></div>
          </Card>
        </section>

        <aside className="reception-side-column">
          <Card className="walkin-card"><div className="walkin-heading"><span className="feature-card__icon"><UserPlus size={17} /></span><div><p className="eyebrow">{t('reception.walkIn')}</p><p>{t('reception.walkInDescription')}</p></div></div>
            <form className="walkin-form" onSubmit={submitWalkIn}>
              <label className="field"><span>{t('join.name')}</span><input value={walkInName} onChange={(event) => setWalkInName(event.target.value)} autoComplete="name" required /></label>
              <label className="field"><span>{t('join.phone')}</span><input type="tel" inputMode="tel" value={walkInPhone} onChange={(event) => setWalkInPhone(event.target.value)} autoComplete="tel" required /></label>
              <fieldset className="walkin-service-field"><legend>{t('join.serviceSection')}</legend>{dashboard.catalog.services.filter((service) => service.active).map((service) => <label key={service.id}><input type="checkbox" checked={walkInServices.includes(service.id)} onChange={(event) => setWalkInServices((current) => event.target.checked ? [...current, service.id] : current.filter((id) => id !== service.id))} /><span>{localize(service.name, language)}</span><small>{formatPrice(service.priceMinorUnits, language)}</small></label>)}</fieldset>
              <label className="field"><span>{t('join.barberSection')}</span><select value={walkInBarber} onChange={(event) => setWalkInBarber(event.target.value)}><option value="ANY">{t('join.anyBarber')}</option>{availableBarbers.map((barber) => <option key={barber.id} value={barber.id}>{localize(barber.name, language)}</option>)}</select></label>
              <button className="button button--primary walkin-submit" type="submit"><UserPlus size={15} />{t('reception.registerWalkIn')}</button>
            </form>
          </Card>
          <Card className="barber-board-card"><p className="eyebrow"><UsersRound size={14} />{t('reception.barberBoard')}</p>{dashboard.barbers.map((barber) => <div className="barber-board-row" key={barber.id}><span className={`barber-status-dot barber-status-dot--${barber.effectiveAvailability.toLowerCase().replace('_', '-')}`} /><strong>{localize(barber.name, language)}</strong><span>{t(barber.effectiveAvailability === 'AVAILABLE' ? 'barber.available' : barber.effectiveAvailability === 'ON_BREAK' ? 'barber.onBreak' : barber.effectiveAvailability === 'SERVING' ? 'barber.serving' : barber.effectiveAvailability === 'CALLED' ? 'queue.called' : 'barber.unavailable')}</span></div>)}</Card>
        </aside>
      </div>
      <AnimatePresence>{(notice || errorKey) && <motion.div className={`staff-toast${errorKey ? ' staff-toast--error' : ''}`} role={errorKey ? 'alert' : 'status'} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0 }}>{t(errorKey || notice)}<button type="button" onClick={() => { setErrorKey(''); setNotice('') }} aria-label={t('dialog.dismiss')}>×</button></motion.div>}</AnimatePresence>
      <ConfirmDialog open={Boolean(pendingAction)} title={pendingAction?.title ?? ''} message={pendingAction?.message ?? pendingAction?.title ?? ''} confirmLabel={t('dialog.confirm')} onConfirm={confirmPending} onClose={() => setPendingAction(null)} />
    </PageContainer>
  )
}
