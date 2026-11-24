import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export function NotFound() {
  const { t } = useLanguage()
  return <PageContainer className="inner-page not-found"><PageHeader eyebrow="pages.notFound.eyebrow" title={t('common.notFoundTitle')} description={t('common.notFoundBody')} actions={<Button to="/" variant="secondary"><ArrowLeft size={15} />{t('common.backHome')}</Button>} /></PageContainer>
}
