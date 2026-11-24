import { ArrowUpRight, ClipboardList, UsersRound } from 'lucide-react'
import { Card } from '../components/ui/Card.jsx'
import { FoundationNote } from '../components/common/FoundationNote.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export function ReceptionDashboard() {
  const { t } = useLanguage()
  return <PageContainer className="inner-page staff-page"><PageHeader eyebrow="pages.reception.eyebrow" title={t('pages.reception.title')} description={t('pages.reception.description')} /><div className="staff-welcome"><Card className="staff-welcome__main"><span className="feature-card__icon"><ClipboardList size={19} /></span><p className="eyebrow">{t('common.salonOperations')}</p><h2>{t('staff.overview')}</h2><p>{t('common.foundationBody')}</p></Card><Card className="staff-welcome__side"><UsersRound size={18} /><span className="eyebrow">{t('staff.workspace')}</span><ArrowUpRight size={16} className="staff-welcome__arrow" /></Card></div><FoundationNote /></PageContainer>
}
