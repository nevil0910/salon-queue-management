import { CircleCheck, Clock3, Sparkles } from 'lucide-react'
import { Card } from '../components/ui/Card.jsx'
import { FoundationNote } from '../components/common/FoundationNote.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export function MyStatus() {
  const { t } = useLanguage()
  return <PageContainer className="inner-page inner-page--narrow"><PageHeader eyebrow="pages.status.eyebrow" title={t('pages.status.title')} description={t('pages.status.description')} /><Card className="status-foundation"><span className="status-foundation__halo"><CircleCheck size={25} strokeWidth={1.35} /></span><p className="eyebrow"><Clock3 size={13} /> {t('common.foundation')}</p><h2>{t('common.comingNext')}</h2><p>{t('common.foundationBody')}</p><div className="status-foundation__ornament"><Sparkles size={14} /><span /><Sparkles size={14} /></div></Card><FoundationNote /></PageContainer>
}
