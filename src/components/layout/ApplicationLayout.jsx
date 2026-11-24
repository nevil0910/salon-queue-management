import { useLocation } from 'react-router-dom'
import { Brand } from '../common/Brand.jsx'
import { LanguageSwitcher } from '../common/LanguageSwitcher.jsx'
import { Navigation } from './Navigation.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

export function ApplicationLayout({ children }) {
  const location = useLocation()
  const { t } = useLanguage()
  const isDisplay = location.pathname === '/display'
  const isStaff = ['/reception', '/barber', '/admin'].some((prefix) => location.pathname.startsWith(prefix))

  if (isDisplay) return <div className="display-shell">{children}</div>

  return (
    <div className={`app-shell${isStaff ? ' app-shell--staff' : ''}`}>
      <div className="ambient-glow ambient-glow--one" aria-hidden="true" />
      <div className="ambient-glow ambient-glow--two" aria-hidden="true" />
      <header className="topbar">
        <Brand compact={false} />
        {!isStaff && <Navigation variant="customer" />}
        <div className="topbar__actions"><LanguageSwitcher /></div>
      </header>
      {isStaff ? (
        <div className="staff-layout">
          <aside className="staff-sidebar"><Navigation variant="staff" /></aside>
          <div className="staff-content">{children}</div>
        </div>
      ) : children}
      <footer className="site-footer"><span>{t('brand')} <span className="gold-dot">·</span> {t('tagline')}</span><span>© ELITE</span></footer>
    </div>
  )
}
