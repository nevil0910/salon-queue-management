import { Clock3, Sparkles, TvMinimal } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { Brand } from '../components/common/Brand.jsx'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher.jsx'
import { formatCount } from '../lib/formatters.js'
import { getQueueDashboard, refreshPublicState, subscribeToQueueUpdates } from '../lib/queueRepository.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

function localize(value, language) { return typeof value === 'string' ? value : value?.[language] ?? '' }

export function WaitingDisplay() {
  const { language, t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const [dashboard, setDashboard] = useState(null)
  const [now, setNow] = useState(() => new Date())
  const refresh = useCallback(() => { refreshPublicState().then(setDashboard).catch(() => {}); setNow(new Date()) }, [])

  useEffect(() => {
    refresh()
    const unsubscribe = subscribeToQueueUpdates(refresh)
    const timer = window.setInterval(() => setNow(new Date()), 15_000)
    return () => { unsubscribe(); window.clearInterval(timer) }
  }, [refresh])

  const locale = language === 'gu' ? 'gu-IN' : 'en-IN'
  if (!dashboard) return <main className="tv-screen tv-screen--live" role="status">{t('common.loading')}</main>
  const serving = dashboard.inChair
  const next = dashboard.waiting.slice(0, 5)

  return <main className="tv-screen tv-screen--live">
    <div className="tv-screen__top"><Brand /><LanguageSwitcher quiet /><span className="tv-screen__mode"><TvMinimal size={14} />{t('display.eyebrow')}</span></div>
    <div className="tv-live-layout">
      <section className="tv-now-serving" aria-labelledby="tv-serving-title">
        <div className="tv-section-label"><Sparkles size={15} />{t('display.eyebrow')}</div><h1 id="tv-serving-title">{t('display.nowServing')}</h1>
        {serving.length ? <div className="tv-serving-list">{serving.map((entry) => {
          const barber = dashboard.catalog.barbers.find((item) => item.id === entry.assignedBarberId)
          return <AnimatePresence mode="popLayout" key={entry.id} initial={false}><motion.article className="tv-serving-item" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .24 }}>
            <span className="tv-serving-item__token">{entry.token}</span><div><p>{t('display.barber')}: {localize(barber?.name ?? '', language)}</p></div>
          </motion.article></AnimatePresence>
        })}</div> : <div className="tv-no-serving"><span className="tv-no-serving__mark"><Clock3 size={24} /></span><p>{t('display.noServing')}</p></div>}
        <p className="tv-listen-guidance">{t('display.pleaseListen')}</p>
      </section>
      <section className="tv-next-panel" aria-labelledby="tv-next-title">
        <div className="tv-section-label"><span className="tv-section-label__index">05</span>{t('display.nextTokens')}</div><h2 id="tv-next-title">{t('display.nextTokens')}</h2>
        {next.length ? <ol className="tv-next-list">{next.map((entry, index) => <motion.li key={entry.id} initial={reduceMotion ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : .18, delay: reduceMotion ? 0 : index * .04 }}><span>{formatCount(index + 1, language)}</span><strong>{entry.token}</strong></motion.li>)}</ol> : <p className="tv-no-next">{t('display.noNext')}</p>}
      </section>
    </div>
    <div className="tv-screen__bottom"><span>{t('tagline')}</span><span className="tv-live-clock"><Clock3 size={13} />{new Intl.DateTimeFormat(locale, { weekday: 'long', hour: 'numeric', minute: '2-digit' }).format(now)}</span><span>{t('display.localNotice')}</span></div>
  </main>
}
