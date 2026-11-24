import { ArrowDownRight, ArrowUpRight, Clock3, MapPin, Scissors, UsersRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { salonPreviewCatalog } from '../data/salonPreviewCatalog.js'
import { formatCount, formatDuration, formatPrice } from '../lib/formatters.js'
import { getSalonSnapshot } from '../lib/salonSnapshot.js'
import { subscribeToQueueUpdates } from '../lib/queueRepository.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const statusKeys = { OPEN: 'home.open', CLOSING_SOON: 'home.closingSoon', CLOSED: 'home.closed', OPENING_SOON: 'home.openingSoon' }

function formatHour(value, language) {
  const [hour, minute] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return new Intl.DateTimeFormat(language === 'gu' ? 'gu-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' }).format(date)
}

export function Home() {
  const { language, t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const [snapshot, setSnapshot] = useState(() => getSalonSnapshot(salonPreviewCatalog))

  useEffect(() => {
    const refresh = () => setSnapshot(getSalonSnapshot(salonPreviewCatalog))
    const unsubscribe = subscribeToQueueUpdates(refresh)
    const clock = window.setInterval(refresh, 60_000)
    return () => { unsubscribe(); window.clearInterval(clock) }
  }, [])

  const statusLabel = t(statusKeys[snapshot.status])
  const services = snapshot.services.slice(0, 3)

  return (
    <PageContainer className="home-page home-page--identity">
      <div className="preview-notice" role="note">
        <span className="preview-notice__dot" aria-hidden="true" />
        <span className="preview-notice__label">{t('home.previewLabel')}</span>
        <span>{t('home.previewNotice')}</span>
      </div>

      <section className="identity-hero" aria-labelledby="home-title">
        <div className="identity-hero__copy">
          <p className="eyebrow"><span className="eyebrow__line" aria-hidden="true" />{t('pages.home.eyebrow')}</p>
          <motion.h1 id="home-title" className="identity-hero__title" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.58, ease: 'easeOut' }}>{t('pages.home.title')}</motion.h1>
          <motion.p className="identity-hero__description" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.48, delay: reduceMotion ? 0 : 0.12 }}>{t('pages.home.description')}</motion.p>
          <div className="identity-hero__actions">
            {snapshot.onlineJoiningOpen
              ? <Button to="/join">{t('common.explore')} <ArrowUpRight size={16} aria-hidden="true" /></Button>
              : <button className="button button--disabled" type="button" disabled>{t('common.explore')} <ArrowUpRight size={16} aria-hidden="true" /></button>}
            <span>{snapshot.onlineJoiningOpen ? t('pages.home.note') : t('home.onlineClosed')}</span>
          </div>
        </div>
        <motion.div className="identity-hero__art" initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : 0.08 }} aria-hidden="true">
          <div className="identity-hero__seal"><span>E</span><i /><small>ELITE · {t('homeDetails.heroSeal')}</small></div>
          <span className="identity-hero__orbit identity-hero__orbit--one" /><span className="identity-hero__orbit identity-hero__orbit--two" />
          <span className="identity-hero__spark identity-hero__spark--one">✳</span><span className="identity-hero__spark identity-hero__spark--two">✦</span>
        </motion.div>
        <div className="identity-hero__edge-note"><span>01</span><span>{t('tagline')}</span><ArrowDownRight size={16} aria-hidden="true" /></div>
      </section>

      <section className="home-pulse-grid" aria-label={t('home.status')}>
        <Card className="pulse-card pulse-card--open">
          <p className="eyebrow">{t('home.status')}</p>
          <div className="pulse-card__status"><span className={`status-indicator status-indicator--${snapshot.status.toLowerCase().replace('_', '-')}`} aria-hidden="true" /><h2>{statusLabel}</h2></div>
          <p className="pulse-card__support"><Clock3 size={14} aria-hidden="true" />{snapshot.hours ? `${formatHour(snapshot.hours.opensAt, language)} – ${formatHour(snapshot.hours.closesAt, language)}` : t('home.hoursNotConfigured')}</p>
        </Card>
        <Card className="pulse-card">
          <p className="eyebrow">{t('home.waiting')}</p>
          <div className="pulse-card__number"><AnimatePresence mode="popLayout" initial={false}><motion.span key={snapshot.waitingCount} initial={reduceMotion ? false : { opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -7 }} transition={{ duration: reduceMotion ? 0 : 0.22 }}>{formatCount(snapshot.waitingCount, language)}</motion.span></AnimatePresence></div>
          <p className="pulse-card__support">{t('home.waitingCustomers')}</p><p className="pulse-card__footnote">{t('home.waitEstimate')}</p>
        </Card>
        <Card className="pulse-card">
          <p className="eyebrow">{t('home.barbers')}</p><div className="pulse-card__number"><span>{formatCount(snapshot.availableBarbers, language)}</span><small>/{formatCount(snapshot.barbers.length, language)}</small></div>
          <p className="pulse-card__support">{t('home.availableNow')}</p>
          <div className="barber-status-list">{snapshot.barbers.map((barber) => <span key={barber.id}><i className={`barber-status-dot barber-status-dot--${barber.availability.toLowerCase().replace('_', '-')}`} aria-hidden="true" />{typeof barber.name === 'string' ? barber.name : barber.name[language]}<small>{t(barber.availability === 'AVAILABLE' ? 'home.available' : barber.availability === 'ON_BREAK' ? 'home.onBreak' : barber.availability === 'SERVING' ? 'home.serving' : 'home.unavailable')}</small></span>)}</div>
        </Card>
      </section>

      <section className="home-services" aria-labelledby="services-title">
        <div className="home-section-heading"><div><p className="eyebrow"><Scissors size={13} aria-hidden="true" />{t('home.servicePreview')}</p><h2 id="services-title">{t('home.servicesTitle')}</h2><p>{t('home.servicesIntro')}</p></div><Link to="/join" className="text-link">{t('home.viewAllServices')} <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        <motion.div className="identity-service-grid" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}>
          {services.map((service, index) => <motion.article key={service.id} className="identity-service-card" variants={{ hidden: reduceMotion ? {} : { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.3 } } }}>
            <span className="identity-service-card__index">0{index + 1}</span><h3>{service.name[language]}</h3><p>{service.description[language]}</p>
            <div className="identity-service-card__meta"><span>{formatDuration(service.durationMinutes, language, t)}</span><strong>{formatPrice(service.priceMinorUnits, language)}</strong></div>
          </motion.article>)}
        </motion.div>
      </section>

      <section className="home-salon-info">
        <div className="home-salon-info__intro"><p className="eyebrow"><UsersRound size={13} aria-hidden="true" />{t('home.salonDetails')}</p><h2>{t('home.salonName')}</h2><p>{t('pages.home.note')}</p></div>
        <div className="home-salon-info__detail"><Clock3 size={17} aria-hidden="true" /><div><span>{t('home.hours')}</span><strong>{snapshot.hours ? `${formatHour(snapshot.hours.opensAt, language)} – ${formatHour(snapshot.hours.closesAt, language)}` : t('home.hoursNotConfigured')}</strong></div></div>
        <div className="home-salon-info__detail"><MapPin size={17} aria-hidden="true" /><div><span>{t('home.addressLabel')}</span><strong>{t('home.locationNotConfigured')}</strong></div></div>
      </section>
    </PageContainer>
  )
}
