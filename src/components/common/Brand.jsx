import { Link } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

export function Brand({ compact = false, to = '/' }) {
  const { t } = useLanguage()
  return (
    <Link to={to} className={`brand ${compact ? 'brand--compact' : ''}`} aria-label={`${t('brand')} — ${t('brandFull')}`}>
      <span className="brand__monogram" aria-hidden="true">E</span>
      <span className="brand__copy">
        <span className="brand__name">{t('brand')}</span>
        {!compact && <span className="brand__subtitle">{t('brandFull')}</span>}
      </span>
    </Link>
  )
}
