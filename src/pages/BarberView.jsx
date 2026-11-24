import { ArrowUpRight, Scissors, Sparkles } from 'lucide-react'
import { Card } from '../components/ui/Card.jsx'
import { FoundationNote } from '../components/common/FoundationNote.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export function BarberView() {
  const { t } = useLanguage()
  return <PageContainer className="inner-page staff-page"><PageHeader eyebrow="pages.barber.eyebrow" title={t('pages.barber.title')} description={t('pages.barber.description')} /><div className="barber-foundation"><Card className="barber-foundation__mark"><span className="barber-foundation__ring"><Scissors size={25} strokeWidth={1.25} /></span><span className="eyebrow">ELITE · {t('nav.barber')}</span><ArrowUpRight size={17} /></Card><Card className="barber-foundation__copy"><Sparkles size={17} /><p>{t('common.comingNext')}</p></Card></div><FoundationNote /></PageContainer>
}
