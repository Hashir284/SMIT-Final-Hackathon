import { Navigate, Route, Routes } from 'react-router-dom'
import useAuth from './context/useAuth.js'
import Dashboard from './pages/Dashboard.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'

export default function AppRouter() {
  const { user, userLoggedIn } = useAuth()

  if (userLoggedIn === null) {
    return (
      <div className="grid min-h-screen place-content-center justify-items-center gap-3 bg-page text-[13px] text-muted" role="status" aria-live="polite">
        <span className="grid size-[42px] place-items-center rounded-full border border-[#96aa94] font-display text-[28px] leading-none text-forest animate-enter">c</span>
        <p className="m-0">Loading your space...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <Routes>
        {userLoggedIn ? (
          <>
            <Route path="/" element={<Home />} />
            {user?.role === 'admin' && <Route path="/dashboard" element={<Dashboard />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </div>
  )
}