import { useLanguage } from '../../i18n/LanguageContext.jsx'

export function LoadingState() {
  const { t } = useLanguage()
  return <div className="loading-state" role="status"><span className="loading-state__mark" aria-hidden="true" /><span>{t('common.loading')}</span></div>
}
