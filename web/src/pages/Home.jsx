import { useState } from 'react'
import { ArrowRight, LogOut, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth.js'
import AuthLayout from '../components/AuthLayout.jsx'

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const fullName = `${user.first_name} ${user.last_name}`.trim()
  const initials = fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  async function handleLogout() {
    setError('')
    try {
      await logout()
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not sign out. Please try again.')
    }
  }

  return (
    <AuthLayout>
      <div className="pt-2">
        <div className="mb-7 grid size-[54px] place-items-center rounded-full border border-[#cbdcc2] bg-success-bg text-[#42664b]"><ShieldCheck size={27} strokeWidth={1.8} /></div>
        <p className="mb-[18px] text-[11px] leading-[1.3] font-bold text-muted uppercase">Your space, your pace</p>
        <h2 className="m-0 font-display text-[clamp(33px,3.3vw,43px)] leading-[1.12] font-normal text-ink max-[650px]:text-[36px]">You're in.</h2>
        <p className="mt-3 mb-7 text-[14px] leading-[1.6] text-muted">Welcome to your Commonroom account.</p>
        <div className="flex min-h-[72px] items-center gap-[13px] border-y border-line">
          <div className="grid size-[42px] shrink-0 place-items-center rounded-full bg-[#dcebd2] text-[13px] font-bold text-[#234b38]">{initials || 'U'}</div>
          <div className="grid min-w-0 gap-[3px]">
            <strong className="overflow-hidden text-ellipsis text-[12px] text-ink whitespace-nowrap">{fullName || user.email}</strong>
            <span className="overflow-hidden text-ellipsis text-[11px] text-muted whitespace-nowrap">{user.email}</span>
          </div>
          {user.role === 'admin' && <span className="ml-auto rounded-[3px] bg-[#e4eddc] px-2 py-1 text-[10px] font-bold text-[#31563e]">Admin</span>}
        </div>
        {error && <p className="mt-[18px] rounded-[4px] bg-error-bg px-3 py-2.5 text-[12px] leading-[1.5] text-error" role="alert">{error}</p>}
        {user.role === 'admin' && (
          <Link className="mt-5 flex min-h-[49px] items-center justify-center gap-2.5 rounded-[5px] bg-forest text-[13px] font-semibold text-white no-underline transition hover:-translate-y-px hover:bg-[#285342]" to="/dashboard">
            <span>Open dashboard</span><ArrowRight size={18} />
          </Link>
        )}
        <button className="mt-[22px] flex min-h-[49px] w-full items-center justify-center gap-2.5 rounded-[5px] border border-line bg-transparent text-[13px] font-semibold text-ink transition hover:border-[#aab8aa] hover:bg-soft" type="button" onClick={handleLogout}>
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </AuthLayout>
  )
}