import { ArrowUpRight, CalendarClock, CircleUserRound, ClipboardList, Command, Settings2, Scissors, TvMinimal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getStaffSession } from '../../lib/api.js'
import { getStaffIdentity } from '../../lib/queueRepository.js'

const customerLinks = [
  { to: '/', key: 'nav.home', icon: Command, end: true },
  { to: '/join', key: 'nav.join', icon: CalendarClock },
]

const staffLinks = [
  { to: '/reception', key: 'nav.reception', icon: ClipboardList },
  { to: '/barber', key: 'nav.barber', icon: Scissors },
  { to: '/admin', key: 'nav.admin', icon: Settings2 },
]

export function Navigation({ variant = 'customer' }) {
  const { t } = useLanguage()
  const location = useLocation()
  const [role, setRole] = useState(null)
  useEffect(() => {
    let active = true
    const loadRole = () => {
      if (!getStaffSession()) { setRole(null); return }
      getStaffIdentity().then((user) => { if (active) setRole(user.role) }).catch(() => { if (active) setRole(null) })
    }
    loadRole()
    window.addEventListener('elite:staff-session-changed', loadRole)
    return () => { active = false; window.removeEventListener('elite:staff-session-changed', loadRole) }
  }, [location.pathname])
  const visibleStaffLinks = role ? staffLinks.filter(({ key }) => (role === 'OWNER' && key === 'nav.admin') || (role === 'RECEPTION' && key === 'nav.reception') || (role === 'BARBER' && key === 'nav.barber')) : []
  const links = variant === 'staff' ? visibleStaffLinks : customerLinks
  const isDisplay = location.pathname === '/display'

  if (isDisplay) return null

  if (variant === 'staff') {
    return (
      <nav className="staff-nav" aria-label={t('staff.workspace')}>
        <p className="eyebrow staff-nav__label">{t('staff.workspace')}</p>
        {links.map(({ to, key, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `staff-nav__link${isActive ? ' is-active' : ''}`}>
            <Icon size={17} strokeWidth={1.7} aria-hidden="true" /><span>{t(key)}</span><ArrowUpRight className="staff-nav__arrow" size={14} aria-hidden="true" />
          </NavLink>
        ))}
        <NavLink to="/display" className="staff-nav__display"><TvMinimal size={16} aria-hidden="true" /><span>{t('staff.displayMode')}</span></NavLink>
      </nav>
    )
  }

  return (
    <nav className="customer-nav" aria-label={t('common.customerExperience')}>
      {links.map(({ to, key, icon: Icon, end }) => (
        <NavLink key={to} end={end} to={to} className={({ isActive }) => `customer-nav__link${isActive ? ' is-active' : ''}`}>
          <Icon size={15} strokeWidth={1.75} aria-hidden="true" /><span>{t(key)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
