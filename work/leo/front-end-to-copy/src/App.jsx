import { useEffect, useRef } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { NAV } from './config.js'
import { useStore } from './store.jsx'
import Icon from './components/icons.jsx'
import DemoPanel from './components/DemoPanel.jsx'
import { Connect, Cv, Generating, Mighty, Welcome, Words } from './screens/onboarding.jsx'
import { Ask, Give, Inbox, Send, Share } from './screens/mights.jsx'
import { AllMight, Card, Home, Profile } from './screens/profile.jsx'
import { Network, People, Person, Roles } from './screens/discover.jsx'

const NO_NAV = ['/', '/cv', '/words', '/connect', '/generating', '/give']

export default function App() {
  const { session, toast } = useStore()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const screen = useRef(null)

  useEffect(() => {
    const give = new URLSearchParams(window.location.search).get('give')
    if (!give) return
    window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    navigate(`/give/${encodeURIComponent(give)}`, { replace: true })
  }, [])

  useEffect(() => {
    screen.current?.scrollTo(0, 0)
  }, [pathname])

  const member = (element) => (session.meId ? element : <Navigate to="/" replace />)
  const showNav = session.meId && !NO_NAV.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p)))

  return (
    <>
      <div className="phone">
        <main className="screen" ref={screen}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/cv" element={<Cv />} />
            <Route path="/words" element={<Words />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/generating" element={<Generating />} />
            <Route path="/mighty" element={<Mighty />} />
            <Route path="/give/:id" element={<Give />} />
            <Route path="/home" element={member(<Home />)} />
            <Route path="/send/:id?" element={member(<Send />)} />
            <Route path="/ask" element={member(<Ask />)} />
            <Route path="/share" element={member(<Share />)} />
            <Route path="/inbox" element={member(<Inbox />)} />
            <Route path="/all" element={member(<AllMight />)} />
            <Route path="/card" element={member(<Card />)} />
            <Route path="/people" element={member(<People />)} />
            <Route path="/people/:id" element={member(<Person />)} />
            <Route path="/graph" element={member(<Network />)} />
            <Route path="/roles" element={member(<Roles />)} />
            <Route path="/profile" element={member(<Profile />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {showNav && (
          <nav>
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => [item.main && 'fab', isActive && 'on'].filter(Boolean).join(' ')}>
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
      <DemoPanel />
    </>
  )
}
