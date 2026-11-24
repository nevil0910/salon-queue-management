import { ArrowRight, Clock3, UserRound } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { FoundationNote } from '../components/common/FoundationNote.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export function JoinQueue() {
  const { t } = useLanguage()
  return <PageContainer className="inner-page"><PageHeader eyebrow="pages.join.eyebrow" title={t('pages.join.title')} description={t('pages.join.description')} actions={<Button to="/status/foundation" variant="secondary">{t('nav.status')} <ArrowRight size={15} /></Button>} /><div className="intro-grid"><Card className="intro-card"><span className="feature-card__icon"><Clock3 size={19} /></span><p className="eyebrow">01 / {t('common.customerExperience')}</p><p className="intro-card__statement">{t('common.comingNext')}</p></Card><Card className="intro-card intro-card--outline"><span className="feature-card__icon"><UserRound size={19} /></span><p className="eyebrow">02 / {t('homeDetails.preview')}</p><p className="intro-card__statement">{t('common.foundationBody')}</p></Card></div><FoundationNote /></PageContainer>
}
