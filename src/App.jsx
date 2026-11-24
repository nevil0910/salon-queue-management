import { lazy, Suspense } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ApplicationLayout } from './components/layout/ApplicationLayout.jsx'
import { LoadingState } from './components/ui/LoadingState.jsx'
import { StaffAccess } from './components/auth/StaffAccess.jsx'

const BarberView = lazy(() => import('./pages/BarberView.jsx').then((module) => ({ default: module.BarberView })))
const Home = lazy(() => import('./pages/Home.jsx').then((module) => ({ default: module.Home })))
const JoinQueue = lazy(() => import('./pages/JoinQueue.jsx').then((module) => ({ default: module.JoinQueue })))
const MyStatus = lazy(() => import('./pages/MyStatus.jsx').then((module) => ({ default: module.MyStatus })))
const NotFound = lazy(() => import('./pages/NotFound.jsx').then((module) => ({ default: module.NotFound })))
const OwnerSettings = lazy(() => import('./pages/OwnerSettings.jsx').then((module) => ({ default: module.OwnerSettings })))
const ReceptionDashboard = lazy(() => import('./pages/ReceptionDashboard.jsx').then((module) => ({ default: module.ReceptionDashboard })))
const WaitingDisplay = lazy(() => import('./pages/WaitingDisplay.jsx').then((module) => ({ default: module.WaitingDisplay })))

function RouteTransition({ children }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <ApplicationLayout>
      <AnimatePresence mode="wait" initial={false}>
        <RouteTransition key={location.pathname}>
          <Suspense fallback={<LoadingState />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/join" element={<JoinQueue />} />
            <Route path="/status/:id" element={<MyStatus />} />
            <Route path="/reception" element={<StaffAccess allowedRoles={['RECEPTION']}><ReceptionDashboard /></StaffAccess>} />
            <Route path="/barber" element={<StaffAccess allowedRoles={['BARBER']}><BarberView /></StaffAccess>} />
            <Route path="/barber/:name" element={<StaffAccess allowedRoles={['BARBER']}><BarberView /></StaffAccess>} />
            <Route path="/display" element={<WaitingDisplay />} />
            <Route path="/admin" element={<StaffAccess allowedRoles={['OWNER']}><OwnerSettings /></StaffAccess>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </RouteTransition>
      </AnimatePresence>
    </ApplicationLayout>
  )
}
