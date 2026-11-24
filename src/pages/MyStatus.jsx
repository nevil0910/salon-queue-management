import { ArrowLeft, Check, Clock3, UserRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { Card } from '../components/ui/Card.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { formatCount, formatDuration, formatPrice } from '../lib/formatters.js'
import { cancelCustomerStatus, getRegistrationStatusAsync, subscribeToQueueUpdates } from '../lib/queueRepository.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const lifecycle = ['Waiting', 'Called', 'In Chair', 'Done']
const statusKeys = {
  Waiting: 'queue.waiting',
  Called: 'queue.called',
  'In Chair': 'queue.inChair',
  Done: 'queue.done',
  Cancelled: 'queue.cancelled',
  'No-show': 'queue.noShow',
}

export function MyStatus() {
  const { id } = useParams()
  const { language, t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const [status, setStatus] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(() => new Date())
  const [cancelOpen, setCancelOpen] = useState(false)
  const [errorKey, setErrorKey] = useState('')
  const [feedbackKey, setFeedbackKey] = useState('')

  const refresh = useCallback(() => {
    getRegistrationStatusAsync(id).then(setStatus).catch(() => setStatus(null)).finally(() => setUpdatedAt(new Date()))
  }, [id])

  useEffect(() => {
    refresh()
    const unsubscribe = subscribeToQueueUpdates(refresh)
    const timer = window.setInterval(refresh, 30_000)
    return () => { unsubscribe(); window.clearInterval(timer) }
  }, [refresh])

  const handleCancel = useCallback(async () => {
    try {
      await cancelCustomerStatus(id, t('status.cancelAction'))
      setCancelOpen(false)
      setErrorKey('')
      setFeedbackKey('status.cancelSuccess')
      refresh()
    } catch (error) {
      setErrorKey(error?.message || 'queue.onlyWaitingCanCancel')
      setCancelOpen(false)
    }
  }, [id, refresh, t])

  if (!status) {
    return <PageContainer className="inner-page inner-page--narrow status-page"><Card className="status-empty"><p className="eyebrow">{t('status.eyebrow')}</p><h1>{t('status.invalidTitle')}</h1><p>{t('status.invalidMessage')}</p><Link className="button button--secondary" to="/"> <ArrowLeft size={15} />{t('status.home')}</Link></Card></PageContainer>
  }

  const { entry, position, estimatedWaitingMinutes } = status
  const currentStep = lifecycle.indexOf(entry.status)
  const barberName = entry.barberPreference.kind === 'ANY'
    ? t('queue.anyBarber')
    : entry.barberPreference.barberNameSnapshot ?? t('queue.anyBarber')
  const canCancel = entry.status === 'Waiting'
  const isTerminal = ['Done', 'Cancelled', 'No-show'].includes(entry.status)
  const locale = language === 'gu' ? 'gu-IN' : 'en-IN'

  return (
    <PageContainer className="inner-page inner-page--narrow status-page">
      <header className={`status-hero status-hero--${entry.status.toLowerCase().replace(' ', '-')}`}>
        <div className="status-hero__copy"><p className="eyebrow"><span className="eyebrow__line" aria-hidden="true" />{t('status.eyebrow')}</p><h1>{entry.customer.displayName}</h1><p>{t(statusKeys[entry.status])}</p></div>
        <motion.div className="status-token" key={entry.token} initial={reduceMotion ? false : { opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : .25 }}><span>{t('status.token')}</span><strong>{entry.token}</strong></motion.div>
        {entry.status === 'Called' && <motion.div className="your-turn-banner" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .25 }}><span className="your-turn-banner__mark"><Check size={17} /></span><div><strong>{t('status.yourTurn')}</strong><span>{t('status.calledGuidance')}</span></div></motion.div>}
      </header>

      {['Cancelled', 'No-show', 'Done'].includes(entry.status) ? <Card className="status-terminal"><h2>{t(entry.status === 'Done' ? 'status.completedTitle' : entry.status === 'Cancelled' ? 'status.cancelledTitle' : 'status.noShowTitle')}</h2><p>{t(entry.status === 'Done' ? 'status.completedMessage' : entry.status === 'No-show' ? 'status.rejoin' : 'status.cancelSuccess')}</p>{entry.status === 'No-show' && <Link className="button button--primary" to="/join">{t('status.rejoin')}</Link>}</Card> : <section className="status-progress-section" aria-label={t('status.progress')}>
        <div className="status-progress-track" aria-hidden="true"><span style={{ width: `${Math.max(0, currentStep) / (lifecycle.length - 1) * 100}%` }} /></div>
        <ol className="status-steps">{lifecycle.map((step, index) => <li key={step} className={index < currentStep ? 'is-complete' : index === currentStep ? 'is-current' : ''}><span className="status-step-mark">{index < currentStep ? <Check size={13} /> : formatCount(index + 1, language)}</span><span>{t(statusKeys[step])}</span></li>)}</ol>
      </section>}

      {entry.status === 'Waiting' && <div className="status-live-grid">
        <Card className="status-position-card"><div><p className="eyebrow">{t('status.queuePosition')}</p><div className="status-position-number"><AnimatePresence mode="popLayout" initial={false}><motion.span key={position ?? 0} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}>{formatCount(position ?? 0, language)}</motion.span></AnimatePresence></div><p className="status-muted">{t('status.positionValue')}</p></div><div className="wait-ring" role="progressbar" aria-label={t('status.estimatedWait')} aria-valuetext={estimatedWaitingMinutes === null ? t('status.waitUnavailable') : formatDuration(estimatedWaitingMinutes, language, t)}><span><Clock3 size={20} /><strong>{estimatedWaitingMinutes === null ? '—' : formatDuration(estimatedWaitingMinutes, language, t)}</strong></span></div></Card>
        <div className="status-detail-stack"><Card className="status-detail-card"><p className="eyebrow">{t('status.selectedServices')}</p><ul>{entry.services.map((service) => <li key={service.serviceId}><span>{service.nameSnapshot}</span><span>{formatDuration(service.durationMinutes, language, t)}</span><strong>{formatPrice(service.priceMinorUnits, language)}</strong></li>)}</ul></Card><Card className="status-detail-card status-barber-card"><UserRound size={18} /><div><p className="eyebrow">{t('status.barberPreference')}</p><strong>{barberName}</strong></div></Card></div>
      </div>}

      {entry.status === 'Called' && <div className="status-called-details"><Card className="status-detail-card"><p className="eyebrow">{t('status.selectedServices')}</p><ul>{entry.services.map((service) => <li key={service.serviceId}><span>{service.nameSnapshot}</span><span>{formatDuration(service.durationMinutes, language, t)}</span><strong>{formatPrice(service.priceMinorUnits, language)}</strong></li>)}</ul></Card><Card className="status-detail-card status-barber-card"><UserRound size={18} /><div><p className="eyebrow">{t('status.barberPreference')}</p><strong>{barberName}</strong></div></Card></div>}

      {entry.status === 'In Chair' && <Card className="status-detail-card status-service-card"><div><p className="eyebrow">{t('status.startedAt')}</p><strong>{entry.startedAt ? new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(entry.startedAt)) : '—'}</strong></div><div><p className="eyebrow">{t('status.selectedServices')}</p><strong>{formatDuration(entry.services.reduce((sum, service) => sum + service.durationMinutes, 0), language, t)}</strong></div><div><p className="eyebrow">{t('status.barberPreference')}</p><strong>{barberName}</strong></div></Card>}

      {canCancel && <div className="status-footer-actions"><div className="status-updated"><span className="status-live-dot" />{t('status.lastUpdated')} · {new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(updatedAt)}</div><button className="text-button status-cancel-button" type="button" onClick={() => setCancelOpen(true)}>{t('status.cancelAction')}</button></div>}
      {isTerminal && <div className="status-footer-actions"><div className="status-updated">{t('status.lastUpdated')} · {new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(updatedAt)}</div><Link className="text-button" to="/">{t('status.home')}</Link></div>}
      {feedbackKey && <p className="status-feedback" role="status">{t(feedbackKey)}</p>}
      {errorKey && <p className="status-error" role="alert">{t(errorKey)}</p>}
      <ConfirmDialog open={cancelOpen} title={t('status.cancelTitle')} message={t('status.cancelMessage')} confirmLabel={t('status.cancelConfirm')} onConfirm={handleCancel} onClose={() => setCancelOpen(false)} />
    </PageContainer>
  )
}
