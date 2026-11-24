import { Languages } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

export function LanguageSwitcher({ quiet = false }) {
  const { language, setLanguage, t } = useLanguage()
  return (
    <button
      type="button"
      className={`language-switcher ${quiet ? 'language-switcher--quiet' : ''}`}
      onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
      aria-label={`${t('language')}: ${t('switchLanguage')}`}
      title={t('language')}
    >
      <Languages size={16} strokeWidth={1.7} aria-hidden="true" />
      <span>{t('switchLanguage')}</span>
    </button>
  )
}
