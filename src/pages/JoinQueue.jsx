import { ArrowLeft, ArrowRight, Check, Clock3, Scissors, Sparkles, UserRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { formatCount, formatDuration, formatPrice } from '../lib/formatters.js'
import { getSalonSnapshot } from '../lib/salonSnapshot.js'
import { createQueueRegistration, subscribeToQueueUpdates } from '../lib/queueRepository.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

function selectedPrice(services) {
  return services.reduce((sum, service) => sum + service.priceMinorUnits, 0)
}

function selectedDuration(services) {
  return services.reduce((sum, service) => sum + service.durationMinutes, 0)
}

export function JoinQueue() {
  const { language, t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedServiceIds, setSelectedServiceIds] = useState([])
  const [barberChoice, setBarberChoice] = useState('')
  const [errorKey, setErrorKey] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [registration, setRegistration] = useState(null)
  const nameInputRef = useRef(null)
  const phoneInputRef = useRef(null)
  const [snapshot, setSnapshot] = useState(() => getSalonSnapshot())
  useEffect(() => {
    const refresh = () => setSnapshot(getSalonSnapshot())
    const unsubscribe = subscribeToQueueUpdates(refresh)
    return unsubscribe
  }, [])
  const selectedServices = snapshot.services.filter((service) => selectedServiceIds.includes(service.id))
  const availableBarbers = snapshot.barbers.filter((barber) => barber.active && barber.effectiveAvailability === 'AVAILABLE')
  const duration = selectedDuration(selectedServices)
  const price = selectedPrice(selectedServices)

  function toggleService(serviceId) {
    setErrorKey('')
    setSelectedServiceIds((current) => current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId])
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorKey('')
    if (!customerName.trim()) { setErrorKey('validation.nameRequired'); nameInputRef.current?.focus(); return }
    const normalizedPhone = phone.replace(/\D/g, '')
    if (normalizedPhone.length < 7 || normalizedPhone.length > 15) { setErrorKey('validation.phoneInvalid'); phoneInputRef.current?.focus(); return }
    if (!selectedServiceIds.length) { setErrorKey('validation.serviceRequired'); return }
    if (!barberChoice) { setErrorKey('validation.barberRequired'); return }
    if (!getSalonSnapshot().onlineJoiningOpen) { setErrorKey('join.onlineClosed'); return }

    setSubmitting(true)
    try {
      const created = await createQueueRegistration({
        customerName,
        phone,
        selectedServices: selectedServiceIds,
        barberPreference: barberChoice === 'ANY'
          ? { kind: 'ANY' }
          : { kind: 'SPECIFIC', barberId: barberChoice },
        language,
        salonId: snapshot.catalog.salonId,
      })
      setRegistration(created)
    } catch (error) {
      setErrorKey(error?.message || 'validation.storageUnavailable')
    } finally {
      setSubmitting(false)
    }
  }

  function startAnotherRegistration() {
    setRegistration(null)
    setCustomerName('')
    setPhone('')
    setSelectedServiceIds([])
    setBarberChoice('')
    setErrorKey('')
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  if (registration) {
    return (
      <PageContainer className="join-page join-page--success">
        <div className="preview-notice" role="note"><span className="preview-notice__dot" aria-hidden="true" /><span className="preview-notice__label">{t('join.previewLabel')}</span><span>{t('join.localNotice')}</span></div>
        <motion.section className="confirmation-card" initial={reduceMotion ? false : { opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduceMotion ? 0 : .38 }} aria-labelledby="confirmation-title">
          <div className="confirmation-card__icon"><Check size={22} aria-hidden="true" /></div>
          <p className="eyebrow">{t('join.successEyebrow')}</p>
          <h1 id="confirmation-title">{t('join.token')}</h1>
          <motion.div className="confirmation-token" initial={reduceMotion ? false : { scale: .82, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 18, delay: reduceMotion ? 0 : .12 }}>{registration.token}</motion.div>
          <div className="confirmation-summary">
            <div><span>{t('join.selectedServices')}</span><ul>{registration.services.map((service) => <li key={service.serviceId}>{service.nameSnapshot}</li>)}</ul></div>
            <div><span>{t('join.selectedBarber')}</span><strong>{registration.barberPreference.kind === 'ANY' ? t('join.anyBarber') : registration.barberPreference.barberNameSnapshot}</strong></div>
            <div><span>{t('join.duration')}</span><strong>{formatDuration(registration.services.reduce((sum, service) => sum + service.durationMinutes, 0), language, t)}</strong></div>
          </div>
          <p className="confirmation-wait">{registration.estimatedWaitingMinutes === null ? t('join.waitUnavailable') : `${t('status.estimatedWait')}: ${formatDuration(registration.estimatedWaitingMinutes, language, t)}`}</p>
          <div className="confirmation-actions"><Button to={`/status/${registration.id}`}>{t('join.statusLink')} <ArrowRight size={15} /></Button><button className="text-button" type="button" onClick={startAnotherRegistration}>{t('join.anotherRegistration')}</button></div>
        </motion.section>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="join-page">
      <div className="join-heading-row"><div><p className="eyebrow"><span className="eyebrow__line" aria-hidden="true" />{t('pages.join.eyebrow')}</p><h1 className="join-title">{t('pages.join.title')}</h1><p className="join-description">{t('pages.join.description')}</p></div><Link to="/" className="back-link"><ArrowLeft size={15} aria-hidden="true" />{t('common.backHome')}</Link></div>
      <div className="preview-notice" role="note"><span className="preview-notice__dot" aria-hidden="true" /><span className="preview-notice__label">{t('join.previewLabel')}</span><span>{t('join.localNotice')}</span></div>
      {!snapshot.onlineJoiningOpen && <div className="form-alert" role="status">{t('join.onlineClosed')}</div>}
      <form className="join-form-layout" onSubmit={handleSubmit} noValidate>
        <div className="join-form-main">
          <Card className="form-section">
            <div className="form-section__heading"><span className="form-step">01</span><div><h2>{t('join.contactSection')}</h2><p>{t('join.stepsLabel')}</p></div></div>
            <div className="form-fields">
              <label className="field"><span>{t('join.name')}<i aria-hidden="true">*</i></span><input ref={nameInputRef} id="customer-name" autoComplete="name" maxLength={80} required value={customerName} onChange={(event) => { setCustomerName(event.target.value); setErrorKey('') }} placeholder={t('join.namePlaceholder')} /></label>
              <label className="field"><span>{t('join.phone')}<i aria-hidden="true">*</i></span><input ref={phoneInputRef} id="customer-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={24} required value={phone} onChange={(event) => { setPhone(event.target.value); setErrorKey('') }} placeholder={t('join.phonePlaceholder')} aria-describedby="phone-help" /><small id="phone-help">{t('join.phoneHelp')}</small></label>
            </div>
          </Card>

          <Card className="form-section">
            <div className="form-section__heading"><span className="form-step">02</span><div><h2>{t('join.serviceSection')}</h2><p>{t('join.serviceHint')}</p></div></div>
            <motion.div className="join-service-list" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : .06 } } }}>
              {snapshot.services.map((service, index) => {
                const isSelected = selectedServiceIds.includes(service.id)
                return <motion.button key={service.id} type="button" role="checkbox" aria-checked={isSelected} className={`join-service-option${isSelected ? ' is-selected' : ''}`} onClick={() => toggleService(service.id)} variants={{ hidden: reduceMotion ? {} : { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : .24 } } }} whileTap={reduceMotion ? undefined : { scale: .99 }}>
                  <span className="join-service-option__check">{isSelected ? <Check size={15} aria-hidden="true" /> : <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>}</span>
                  <span className="join-service-option__copy"><strong>{service.name[language]}</strong><small>{service.description[language]}</small></span>
                  <span className="join-service-option__meta"><strong>{formatPrice(service.priceMinorUnits, language)}</strong><small><Clock3 size={12} aria-hidden="true" />{formatDuration(service.durationMinutes, language, t)}</small></span>
                </motion.button>
              })}
            </motion.div>
          </Card>

          <Card className="form-section">
            <div className="form-section__heading"><span className="form-step">03</span><div><h2>{t('join.barberSection')}</h2><p>{t('join.chooseBarber')}</p></div></div>
            <div className="barber-choice-list" role="radiogroup" aria-label={t('join.barberSection')}>
              <label className={`barber-choice${barberChoice === 'ANY' ? ' is-selected' : ''}`}><input type="radio" name="barber" value="ANY" checked={barberChoice === 'ANY'} onChange={() => { setBarberChoice('ANY'); setErrorKey('') }} /><span className="barber-choice__icon"><Sparkles size={17} aria-hidden="true" /></span><span className="barber-choice__copy"><strong>{t('join.anyBarber')}</strong><small>{t('join.anyBarberHint')}</small></span><span className="barber-choice__radio" /></label>
              {snapshot.barbers.filter((barber) => barber.active).map((barber) => {
                const available = barber.effectiveAvailability === 'AVAILABLE'
                return <label key={barber.id} className={`barber-choice${barberChoice === barber.id ? ' is-selected' : ''}${!available ? ' is-unavailable' : ''}`}>
                  <input type="radio" name="barber" value={barber.id} checked={barberChoice === barber.id} onChange={() => { setBarberChoice(barber.id); setErrorKey('') }} disabled={!available} />
                  <span className="barber-choice__icon"><UserRound size={17} aria-hidden="true" /></span><span className="barber-choice__copy"><strong>{typeof barber.name === 'string' ? barber.name : barber.name[language]}</strong><small>{t(available ? 'home.available' : barber.effectiveAvailability === 'ON_BREAK' ? 'home.onBreak' : barber.effectiveAvailability === 'CALLED' ? 'home.called' : barber.effectiveAvailability === 'SERVING' ? 'home.serving' : 'home.unavailable')}</small></span><span className="barber-choice__radio" />
                </label>
              })}
              {!availableBarbers.length && <p className="form-hint">{t('join.noBarberAvailable')}</p>}
            </div>
          </Card>
        </div>

        <aside className="join-summary-column">
          <Card className="join-summary">
            <div className="join-summary__top"><Scissors size={18} aria-hidden="true" /><span>{t('join.serviceSection')}</span></div>
            <p className="join-summary__count">{formatCount(selectedServices.length, language)} <span>{t('join.serviceCount')}</span></p>
            <div className="join-summary__items">{selectedServices.length ? selectedServices.map((service) => <div key={service.id}><span>{service.name[language]}</span><strong>{formatPrice(service.priceMinorUnits, language)}</strong></div>) : <p>{t('join.chooseService')}</p>}</div>
            <div className="join-summary__totals"><div><span>{t('join.duration')}</span><strong>{duration ? formatDuration(duration, language, t) : '—'}</strong></div><div><span>{t('join.total')}</span><strong className="join-price-motion"><motion.span key={price} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .18 }}>{formatPrice(price, language)}</motion.span></strong></div></div>
            <AnimatePresence initial={false}><div className="join-error-slot" aria-live="polite">{errorKey && <motion.p key={errorKey} role="alert" initial={reduceMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .16 }}>{t(errorKey)}</motion.p>}</div></AnimatePresence>
            <button className="button button--primary join-submit" type="submit" disabled={submitting || !snapshot.onlineJoiningOpen}>{submitting ? t('join.submitting') : t('join.submit')} <ArrowRight size={15} aria-hidden="true" /></button>
            <p className="join-summary__fineprint">{t('join.localNotice')}</p>
          </Card>
          <div className="join-summary__back"><Clock3 size={14} aria-hidden="true" /><span>{snapshot.hours ? `${formatPrice(price, language)} · ${t('join.duration')}: ${duration ? formatDuration(duration, language, t) : '—'}` : t('home.hoursNotConfigured')}</span></div>
        </aside>
      </form>
    </PageContainer>
  )
}
