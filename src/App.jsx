import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ApplicationLayout } from './components/layout/ApplicationLayout.jsx'
import { BarberView } from './pages/BarberView.jsx'
import { Home } from './pages/Home.jsx'
import { JoinQueue } from './pages/JoinQueue.jsx'
import { MyStatus } from './pages/MyStatus.jsx'
import { NotFound } from './pages/NotFound.jsx'
import { OwnerSettings } from './pages/OwnerSettings.jsx'
import { ReceptionDashboard } from './pages/ReceptionDashboard.jsx'
import { WaitingDisplay } from './pages/WaitingDisplay.jsx'

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
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/join" element={<JoinQueue />} />
            <Route path="/status/:id" element={<MyStatus />} />
            <Route path="/reception" element={<ReceptionDashboard />} />
            <Route path="/barber/:name" element={<BarberView />} />
            <Route path="/display" element={<WaitingDisplay />} />
            <Route path="/admin" element={<OwnerSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RouteTransition>
      </AnimatePresence>
    </ApplicationLayout>
  )
}
