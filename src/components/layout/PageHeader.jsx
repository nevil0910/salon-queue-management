import { motion, useReducedMotion } from 'motion/react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

export function PageHeader({ eyebrow, title, description, actions, titleClassName = '' }) {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  return (
    <motion.header
      className="page-header"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.38, ease: 'easeOut' }}
    >
      <div className="page-header__copy">
        <p className="eyebrow"><span className="eyebrow__line" aria-hidden="true" />{t(eyebrow)}</p>
        <h1 className={`page-title ${titleClassName}`.trim()}>{title.includes('\n') ? title.split('\n').map((line, index) => <span key={`${line}-${index}`}>{line}{index === 0 && <br />}</span>) : title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </motion.header>
  )
}
