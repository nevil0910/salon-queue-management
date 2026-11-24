import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onClose, tone = 'danger' }) {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    confirmRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && <motion.div className="dialog-backdrop" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
        <motion.section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" initial={reduceMotion ? false : { opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: 8 }} transition={{ duration: reduceMotion ? 0 : .2 }}>
          <p className="eyebrow">{t('dialog.confirm')}</p>
          <h2 id="confirm-dialog-title">{title}</h2>
          <p id="confirm-dialog-message">{message}</p>
          <div className="confirm-dialog__actions">
            <button className="button button--secondary" type="button" onClick={onClose}>{t('dialog.keep')}</button>
            <button ref={confirmRef} className={`button ${tone === 'danger' ? 'button--danger' : 'button--primary'}`} type="button" onClick={onConfirm}>{confirmLabel ?? t('dialog.confirm')}</button>
          </div>
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  )
}
