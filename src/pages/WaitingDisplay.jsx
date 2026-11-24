import { Maximize2, Sparkles } from 'lucide-react'
import { Brand } from '../components/common/Brand.jsx'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export function WaitingDisplay() {
  const { t } = useLanguage()
  return <main className="tv-screen"><div className="tv-screen__top"><Brand /><LanguageSwitcher quiet /><span className="tv-screen__mode"><Maximize2 size={13} /> {t('staff.displayMode')}</span></div><div className="tv-screen__center"><span className="tv-screen__ornament"><Sparkles size={16} /><span /></span><p className="eyebrow">{t('pages.display.eyebrow')}</p><h1>{t('pages.display.title')}</h1><p className="tv-screen__description">{t('pages.display.description')}</p><div className="tv-screen__rule"><span /><span /><span /></div><p className="tv-screen__note">{t('common.foundationBody')}</p></div><div className="tv-screen__bottom"><span>{t('tagline')}</span><span>ELITE · 01</span></div></main>
}
