import { ArrowUpRight, Settings2, Sparkles } from 'lucide-react'
import { Card } from '../components/ui/Card.jsx'
import { FoundationNote } from '../components/common/FoundationNote.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export function OwnerSettings() {
  const { t } = useLanguage()
  return <PageContainer className="inner-page staff-page"><PageHeader eyebrow="pages.admin.eyebrow" title={t('pages.admin.title')} description={t('pages.admin.description')} /><div className="settings-foundation"><Card className="settings-foundation__main"><span className="feature-card__icon"><Settings2 size={19} /></span><p className="eyebrow">{t('staff.management')}</p><h2>{t('homeDetails.preview')}</h2><p>{t('common.foundationBody')}</p></Card><Card className="settings-foundation__stamp"><Sparkles size={19} /><span>ELITE</span><small>{t('tagline')}</small><ArrowUpRight size={15} /></Card></div><FoundationNote /></PageContainer>
}
