import { CalendarClock, Clock3, Plus, Scissors, Settings2, Trash2, UsersRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { PageContainer } from '../components/layout/PageContainer.jsx'
import { PageHeader } from '../components/layout/PageHeader.jsx'
import { formatCount, formatDuration, formatPrice } from '../lib/formatters.js'
import {
  createBarber,
  createService,
  deleteBarber,
  deleteService,
  getQueueDashboard,
  subscribeToQueueUpdates,
  updateBarber,
  updateQueueControl,
  updateSalonHours,
  updateService,
  refreshStaffState,
  provisionStaffAccount,
} from '../lib/queueRepository.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const tabList = [
  { id: 'services', key: 'admin.services', icon: Scissors },
  { id: 'barbers', key: 'admin.barbers', icon: UsersRound },
  { id: 'hours', key: 'admin.hours', icon: CalendarClock },
  { id: 'statistics', key: 'admin.statistics', icon: Settings2 },
]
const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function localize(value, language) { return typeof value === 'string' ? value : value?.[language] ?? '' }
function makeServiceDraft(service = null) {
  return service ? { ...service, name: { en: localize(service.name, 'en'), gu: localize(service.name, 'gu') }, description: { en: localize(service.description ?? '', 'en'), gu: localize(service.description ?? '', 'gu') }, priceRupees: service.priceMinorUnits / 100 }
    : { name: { en: '', gu: '' }, description: { en: '', gu: '' }, priceRupees: '', durationMinutes: 30, active: true }
}
function makeBarberDraft(barber = null) {
  return barber ? { ...barber, name: { en: localize(barber.name, 'en'), gu: localize(barber.name, 'gu') } }
    : { name: { en: '', gu: '' }, active: true, availability: 'AVAILABLE' }
}

export function OwnerSettings() {
  const { language, t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const [dashboard, setDashboard] = useState(null)
  const [tab, setTab] = useState('services')
  const [serviceDraft, setServiceDraft] = useState(null)
  const [barberDraft, setBarberDraft] = useState(null)
  const [serviceForm, setServiceForm] = useState(null)
  const [barberForm, setBarberForm] = useState(null)
  const [cutoff, setCutoff] = useState(30)
  const [hoursDraft, setHoursDraft] = useState({})
  const [notice, setNotice] = useState('')
  const [errorKey, setErrorKey] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [staffRole, setStaffRole] = useState('RECEPTION')
  const [staffBarberId, setStaffBarberId] = useState('')

  const refresh = useCallback(() => {
    refreshStaffState().then((next) => {
    setDashboard(next)
    setCutoff(next.catalog.onlineCutoffMinutes ?? 30)
    setHoursDraft(next.catalog.hours)
    }).catch(() => {})
  }, [])
  useEffect(() => {
    refresh()
    return subscribeToQueueUpdates(refresh)
  }, [refresh])

  const activeServices = (dashboard?.catalog.services ?? []).filter((service) => service.active)
  const activeBarbers = (dashboard?.barbers ?? []).filter((barber) => barber.active)
  const statisticItems = useMemo(() => [
    ['admin.registrations', dashboard?.statistics.registrations],
    ['reception.done', dashboard?.statistics.completed],
    ['reception.noShow', dashboard?.statistics.noShows],
    ['reception.cancelled', dashboard?.statistics.cancelled],
    ['admin.averageWait', dashboard?.statistics.averageWaitMinutes],
    ['admin.averageService', dashboard?.statistics.averageServiceMinutes],
    ['admin.barberUtilization', dashboard?.statistics.barberUtilizationPercent],
    ['admin.peakPeriod', dashboard?.statistics.peakHour],
  ], [dashboard])

  async function run(action, successKey = 'admin.saved') {
    setErrorKey('')
    setNotice('')
    try { await action(); setNotice(successKey); refresh() }
    catch (error) { setErrorKey(error?.message || 'validation.storageUnavailable') }
  }

  async function submitService(event) {
    event.preventDefault()
    if (!serviceDraft?.name.en.trim() || !serviceDraft.name.gu.trim()) { setErrorKey('validation.serviceNameRequired'); return }
    const payload = {
      name: serviceDraft.name,
      description: serviceDraft.description,
      priceMinorUnits: Math.round(Number(serviceDraft.priceRupees) * 100),
      durationMinutes: Number(serviceDraft.durationMinutes),
      active: serviceDraft.active !== false,
    }
    if (!Number.isFinite(payload.priceMinorUnits) || payload.priceMinorUnits < 0 || !Number.isInteger(payload.durationMinutes) || payload.durationMinutes < 1) { setErrorKey('validation.serviceValuesInvalid'); return }
    await run(() => serviceDraft.id ? updateService(serviceDraft.id, payload) : createService(payload))
    setServiceDraft(null)
    setServiceForm(null)
  }

  async function submitBarber(event) {
    event.preventDefault()
    if (!barberDraft?.name.en.trim() || !barberDraft.name.gu.trim()) { setErrorKey('validation.barberNameRequired'); return }
    const payload = { name: barberDraft.name, availability: barberDraft.availability, active: barberDraft.active !== false }
    await run(() => barberDraft.id ? updateBarber(barberDraft.id, payload) : createBarber(payload))
    setBarberDraft(null)
    setBarberForm(null)
  }

  async function saveHours(event) {
    event.preventDefault()
    await run(() => updateSalonHours(hoursDraft, cutoff))
  }

  async function submitStaff(event) {
    event.preventDefault()
    await run(() => provisionStaffAccount({ email: staffEmail, password: staffPassword, role: staffRole, barberId: staffRole === 'BARBER' ? staffBarberId : null }), 'admin.saved')
    setStaffEmail(''); setStaffPassword('')
  }

  async function confirmDelete() {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)
    await run(action.run)
  }

  if (!dashboard) return <PageContainer className="inner-page staff-page"><p role="status">{t('common.loading')}</p></PageContainer>

  return (
    <PageContainer className="inner-page staff-page admin-page">
      <PageHeader eyebrow="admin.eyebrow" title={t('admin.title')} description={t('admin.description')} />
      <div className="admin-tabs" role="tablist" aria-label={t('admin.title')}>{tabList.map(({ id, key, icon: Icon }) => <button key={id} role="tab" aria-selected={tab === id} type="button" className={tab === id ? 'is-active' : ''} onClick={() => { setTab(id); setServiceForm(null); setBarberForm(null) }}><Icon size={15} />{t(key)}</button>)}</div>

      {tab === 'services' && <section className="admin-section">
        <div className="admin-section__heading"><div><p className="eyebrow">{t('admin.services')}</p><h2>{t('admin.services')}</h2></div><Button onClick={() => { setServiceDraft(makeServiceDraft()); setServiceForm('new') }}><Plus size={15} />{t('admin.addService')}</Button></div>
        {serviceForm && <Card className="admin-edit-card"><form className="admin-form-grid" onSubmit={submitService}><h3>{t(serviceForm === 'new' ? 'admin.addService' : 'admin.editService')}</h3>
          <label className="field"><span>{t('admin.serviceName')} · English</span><input required value={serviceDraft.name.en} onChange={(event) => setServiceDraft({ ...serviceDraft, name: { ...serviceDraft.name, en: event.target.value } })} /></label>
          <label className="field"><span>{t('admin.serviceName')} · ગુજરાતી</span><input required value={serviceDraft.name.gu} onChange={(event) => setServiceDraft({ ...serviceDraft, name: { ...serviceDraft.name, gu: event.target.value } })} /></label>
          <label className="field"><span>{t('admin.descriptionField')} · English</span><input value={serviceDraft.description.en} onChange={(event) => setServiceDraft({ ...serviceDraft, description: { ...serviceDraft.description, en: event.target.value } })} /></label>
          <label className="field"><span>{t('admin.descriptionField')} · ગુજરાતી</span><input value={serviceDraft.description.gu} onChange={(event) => setServiceDraft({ ...serviceDraft, description: { ...serviceDraft.description, gu: event.target.value } })} /></label>
          <label className="field"><span>{t('admin.price')}</span><input type="number" min="0" step="1" required value={serviceDraft.priceRupees} onChange={(event) => setServiceDraft({ ...serviceDraft, priceRupees: event.target.value })} /></label>
          <label className="field"><span>{t('admin.duration')}</span><input type="number" min="1" step="1" required value={serviceDraft.durationMinutes} onChange={(event) => setServiceDraft({ ...serviceDraft, durationMinutes: event.target.value })} /></label>
          <div className="admin-form-actions"><button type="button" className="button button--secondary" onClick={() => { setServiceForm(null); setServiceDraft(null) }}>{t('dialog.cancel')}</button><button className="button button--primary" type="submit">{t('admin.save')}</button></div>
        </form></Card>}
        <div className="admin-list">{dashboard.catalog.services.map((service) => <Card className={`admin-list-row${service.active ? '' : ' is-archived'}`} key={service.id}><div className="admin-list-row__main"><span className="admin-list-row__icon"><Scissors size={16} /></span><div><strong>{localize(service.name, language)}</strong><small>{service.active ? `${formatDuration(service.durationMinutes, language, t)} · ${formatPrice(service.priceMinorUnits, language)}` : t('admin.archived')}</small></div></div><div className="admin-row-actions"><button type="button" className="table-action" onClick={() => { setServiceDraft(makeServiceDraft(service)); setServiceForm('edit') }}>{t('admin.editService')}</button><button type="button" className="icon-action icon-action--danger" aria-label={`${t('admin.delete')} ${localize(service.name, language)}`} onClick={() => setPendingAction({ title: t('admin.confirmDeleteTitle'), message: t('admin.confirmDeleteService'), run: () => deleteService(service.id) })}><Trash2 size={16} /></button></div></Card>)}</div>
        {!activeServices.length && <p className="admin-empty">{t('admin.noServices')}</p>}
      </section>}

      {tab === 'barbers' && <section className="admin-section">
        <div className="admin-section__heading"><div><p className="eyebrow">{t('admin.barbers')}</p><h2>{t('admin.barbers')}</h2></div><Button onClick={() => { setBarberDraft(makeBarberDraft()); setBarberForm('new') }}><Plus size={15} />{t('admin.addBarber')}</Button></div>
        {barberForm && <Card className="admin-edit-card"><form className="admin-form-grid" onSubmit={submitBarber}><h3>{t(barberForm === 'new' ? 'admin.addBarber' : 'admin.editBarber')}</h3>
          <label className="field"><span>{t('admin.barberName')} · English</span><input required value={barberDraft.name.en} onChange={(event) => setBarberDraft({ ...barberDraft, name: { ...barberDraft.name, en: event.target.value } })} /></label>
          <label className="field"><span>{t('admin.barberName')} · ગુજરાતી</span><input required value={barberDraft.name.gu} onChange={(event) => setBarberDraft({ ...barberDraft, name: { ...barberDraft.name, gu: event.target.value } })} /></label>
          <label className="field"><span>{t('admin.availability')}</span><select value={barberDraft.availability} onChange={(event) => setBarberDraft({ ...barberDraft, availability: event.target.value })}><option value="AVAILABLE">{t('barber.available')}</option><option value="ON_BREAK">{t('barber.onBreak')}</option><option value="UNAVAILABLE">{t('barber.unavailable')}</option></select></label>
          <div className="admin-form-actions"><button type="button" className="button button--secondary" onClick={() => { setBarberForm(null); setBarberDraft(null) }}>{t('dialog.cancel')}</button><button className="button button--primary" type="submit">{t('admin.save')}</button></div>
        </form></Card>}
        <div className="admin-list">{dashboard.catalog.barbers.map((barber) => { const currentAvailability = dashboard.barbers.find((item) => item.id === barber.id)?.effectiveAvailability ?? barber.availability; return <Card className={`admin-list-row${barber.active ? '' : ' is-archived'}`} key={barber.id}><div className="admin-list-row__main"><span className="admin-list-row__icon"><UsersRound size={16} /></span><div><strong>{localize(barber.name, language)}</strong><small>{barber.active ? t(currentAvailability === 'AVAILABLE' ? 'barber.available' : currentAvailability === 'ON_BREAK' ? 'barber.onBreak' : currentAvailability === 'SERVING' ? 'barber.serving' : currentAvailability === 'CALLED' ? 'queue.called' : 'barber.unavailable') : t('admin.archived')}</small></div></div><div className="admin-row-actions"><button type="button" className="table-action" onClick={() => { setBarberDraft(makeBarberDraft(barber)); setBarberForm('edit') }}>{t('admin.editBarber')}</button><button type="button" className="icon-action icon-action--danger" aria-label={`${t('admin.delete')} ${localize(barber.name, language)}`} onClick={() => setPendingAction({ title: t('admin.confirmDeleteTitle'), message: t('admin.confirmDeleteBarber'), run: () => deleteBarber(barber.id) })}><Trash2 size={16} /></button></div></Card>})}</div>
        {!activeBarbers.length && <p className="admin-empty">{t('admin.noBarbers')}</p>}
      </section>}

      {tab === 'hours' && <section className="admin-section">
        <div className="admin-section__heading"><div><p className="eyebrow"><Clock3 size={13} />{t('admin.hours')}</p><h2>{t('admin.hours')}</h2></div></div>
        <Card className="hours-card"><form onSubmit={saveHours}>
          <div className="hours-table">{weekdays.map((day, index) => { const hours = hoursDraft[index]; const isOpen = Boolean(hours && hours.isOpen !== false); return <div className="hours-row" key={day}><label className="hours-day"><input type="checkbox" checked={isOpen} onChange={(event) => setHoursDraft((current) => ({ ...current, [index]: event.target.checked ? { isOpen: true, opensAt: hours?.opensAt ?? '10:00', closesAt: hours?.closesAt ?? '22:00' } : null }))} /><strong>{t(`admin.${day}`)}</strong></label><label className="hours-time"><span>{t('admin.openingTime')}</span><input type="time" value={hours?.opensAt ?? '10:00'} disabled={!isOpen} onChange={(event) => setHoursDraft((current) => ({ ...current, [index]: { ...current[index], isOpen: true, opensAt: event.target.value } }))} /></label><label className="hours-time"><span>{t('admin.closingTime')}</span><input type="time" value={hours?.closesAt ?? '22:00'} disabled={!isOpen} onChange={(event) => setHoursDraft((current) => ({ ...current, [index]: { ...current[index], isOpen: true, closesAt: event.target.value } }))} /></label><span className="hours-closed-label">{isOpen ? '' : t('admin.closedDay')}</span></div> })}</div>
          <label className="field cutoff-field"><span>{t('admin.onlineCutoff')} ({t('admin.minutesBefore')})</span><input type="number" min="0" max="180" step="5" value={cutoff} onChange={(event) => setCutoff(event.target.value)} /></label>
          <button type="submit" className="button button--primary">{t('admin.save')}</button>
        </form></Card>
        <Card className="queue-controls-card"><p className="eyebrow">{t('reception.queue')}</p><div className="queue-control-row"><div><strong>{t(dashboard.catalog.queueControls.onlinePaused ? 'admin.resumeOnline' : 'admin.pauseOnline')}</strong><small>{t(dashboard.catalog.queueControls.onlinePaused ? 'home.onlineClosed' : 'join.localNotice')}</small></div><button type="button" role="switch" aria-checked={Boolean(dashboard.catalog.queueControls.onlinePaused)} className={`toggle-switch${dashboard.catalog.queueControls.onlinePaused ? ' is-on' : ''}`} onClick={() => run(() => updateQueueControl('onlinePaused', !dashboard.catalog.queueControls.onlinePaused))}><span /></button></div><div className="queue-control-row"><div><strong>{t(dashboard.catalog.queueControls.walkInsPaused ? 'admin.resumeWalkIns' : 'admin.pauseWalkIns')}</strong><small>{t(dashboard.catalog.queueControls.walkInsPaused ? 'admin.intakePaused' : 'reception.walkInDescription')}</small></div><button type="button" role="switch" aria-checked={Boolean(dashboard.catalog.queueControls.walkInsPaused)} className={`toggle-switch${dashboard.catalog.queueControls.walkInsPaused ? ' is-on' : ''}`} onClick={() => run(() => updateQueueControl('walkInsPaused', !dashboard.catalog.queueControls.walkInsPaused))}><span /></button></div></Card>
      </section>}

      {tab === 'statistics' && <section className="admin-section"><div className="admin-section__heading"><div><p className="eyebrow">{t('admin.statistics')}</p><h2>{t('admin.todayStats')}</h2></div></div><div className="admin-stat-grid">{statisticItems.map(([key, value]) => { const isPeak = key === 'admin.peakPeriod'; const displayValue = isPeak && value !== null ? new Intl.DateTimeFormat(language === 'gu' ? 'gu-IN' : 'en-IN', { hour: 'numeric' }).format(new Date(2020, 0, 1, value)) : value === null ? '—' : formatCount(value, language); return <Card className="admin-stat-card" key={key}><span>{t(key)}</span><strong>{displayValue}{(key === 'admin.averageWait' || key === 'admin.averageService') && value !== null ? ` ${t('home.minutes')}` : key === 'admin.barberUtilization' && value !== null ? '%' : ''}</strong></Card>})}</div><Card className="admin-barber-utilization"><p className="eyebrow">{t('admin.barberUtilization')}</p>{dashboard.barbers.map((barber) => <div key={barber.id}><span>{localize(barber.name, language)}</span><strong>{t(barber.effectiveAvailability === 'AVAILABLE' ? 'barber.available' : barber.effectiveAvailability === 'ON_BREAK' ? 'barber.onBreak' : barber.effectiveAvailability === 'SERVING' ? 'barber.serving' : barber.effectiveAvailability === 'CALLED' ? 'queue.called' : 'barber.unavailable')}</strong></div>)}</Card></section>}

      <section className="admin-section"><div className="admin-section__heading"><div><p className="eyebrow">{t('auth.staff')}</p><h2>{t('auth.provisionTitle')}</h2></div></div><Card className="hours-card"><form onSubmit={submitStaff} className="admin-form-grid"><label className="field"><span>{t('auth.email')}</span><input type="email" value={staffEmail} onChange={(e)=>setStaffEmail(e.target.value)} required /></label><label className="field"><span>{t('auth.password')}</span><input type="password" minLength="12" value={staffPassword} onChange={(e)=>setStaffPassword(e.target.value)} required /></label><label className="field"><span>{t('auth.role')}</span><select value={staffRole} onChange={(e)=>setStaffRole(e.target.value)}><option value="RECEPTION">{t('nav.reception')}</option><option value="BARBER">{t('nav.barber')}</option></select></label>{staffRole==='BARBER'&&<label className="field"><span>{t('admin.barbers')}</span><select required value={staffBarberId} onChange={(e)=>setStaffBarberId(e.target.value)}><option value="">—</option>{dashboard.catalog.barbers.filter((b)=>b.active).map((b)=><option key={b.id} value={b.id}>{localize(b.name,language)}</option>)}</select></label>}<button className="button button--primary" type="submit">{t('auth.provision')}</button></form></Card></section>

      <AnimatePresence>{(notice || errorKey) && <motion.div className={`staff-toast${errorKey ? ' staff-toast--error' : ''}`} role={errorKey ? 'alert' : 'status'} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0 }}>{t(errorKey || notice)}<button type="button" onClick={() => { setErrorKey(''); setNotice('') }} aria-label={t('dialog.dismiss')}>×</button></motion.div>}</AnimatePresence>
      <ConfirmDialog open={Boolean(pendingAction)} title={pendingAction?.title ?? ''} message={pendingAction?.message ?? ''} confirmLabel={t('dialog.delete')} onConfirm={confirmDelete} onClose={() => setPendingAction(null)} />
    </PageContainer>
  )
}
