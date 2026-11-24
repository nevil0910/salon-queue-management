import { Sparkles } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

export function FoundationNote() {
  const { t } = useLanguage()
  return (
    <Card className="foundation-note">
      <span className="foundation-note__icon"><Sparkles size={17} strokeWidth={1.5} aria-hidden="true" /></span>
      <div><p className="foundation-note__label">{t('common.foundation')}</p><p className="foundation-note__copy">{t('common.foundationBody')}</p></div>
    </Card>
  )
}
