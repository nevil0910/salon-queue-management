import { ArrowDownRight, ArrowUpRight, Gem, HandHeart, Scissors } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export function Home() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  return (
    <PageContainer className="home-page">
      <div className="home-hero-grid">
        <div className="home-hero-copy">
          <PageHeader eyebrow="pages.home.eyebrow" title={t('pages.home.title')} description={t('pages.home.description')} />
          <div className="home-actions"><Button to="/join">{t('common.explore')} <ArrowUpRight size={16} aria-hidden="true" /></Button><span className="home-note">{t('pages.home.note')}</span></div>
        </div>
        <motion.div className="hero-art" initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.12 }} aria-hidden="true">
          <div className="hero-art__halo" /><div className="hero-art__frame"><div className="hero-art__inner"><span className="hero-art__roman">E</span><span className="hero-art__rule" /><span className="hero-art__caption">{t('homeDetails.heroSeal')}</span></div></div><span className="hero-art__orbit hero-art__orbit--one" /><span className="hero-art__orbit hero-art__orbit--two" /><span className="hero-art__spark hero-art__spark--one">✳</span><span className="hero-art__spark hero-art__spark--two">✦</span>
        </motion.div>
      </div>
      <div className="home-divider"><span>{t('tagline')}</span><ArrowDownRight size={17} strokeWidth={1.3} aria-hidden="true" /></div>
      <div className="home-feature-grid">
        <Card className="feature-card"><span className="feature-card__icon"><Scissors size={19} strokeWidth={1.4} /></span><p className="eyebrow">01 / {t('homeDetails.craft')}</p><h2>{t('homeDetails.craft')}</h2><p>{t('homeDetails.craftBody')}</p></Card>
        <Card className="feature-card"><span className="feature-card__icon"><HandHeart size={19} strokeWidth={1.4} /></span><p className="eyebrow">02 / {t('homeDetails.hospitality')}</p><h2>{t('homeDetails.hospitality')}</h2><p>{t('homeDetails.hospitalityBody')}</p></Card>
        <Card className="feature-card feature-card--accent"><span className="feature-card__icon"><Gem size={19} strokeWidth={1.4} /></span><p className="eyebrow">03 / ELITE</p><h2>{t('homeDetails.preview')}</h2><p>{t('homeDetails.previewBody')}</p><Link className="text-link" to="/join">{t('common.continue')} <ArrowUpRight size={14} /></Link></Card>
      </div>
    </PageContainer>
  )
}
