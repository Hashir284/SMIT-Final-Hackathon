import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth.js'
import GoogleSignIn from './GoogleSignIn.jsx'

export default function AuthForm({ mode }) {
  const { login, signup } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const isSignup = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    const details = Object.fromEntries(new FormData(event.currentTarget).entries())

    try {
      if (isSignup) {
        await signup(details)
        navigate('/', { replace: true, state: { notice: 'Your account is ready. Sign in with your new details.' } })
      } else {
        await login(details)
        navigate('/', { replace: true })
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <p className="mb-[18px] text-[11px] leading-[1.3] font-bold text-muted uppercase">{isSignup ? 'A good place to begin' : 'Welcome back'}</p>
      <h2 className="m-0 font-display text-[clamp(33px,3.3vw,43px)] leading-[1.12] font-normal text-ink max-[650px]:text-[36px] max-[370px]:text-[32px]">{isSignup ? 'Make room for good work.' : 'Sign in to your space.'}</h2>
      <p className="mt-3 mb-[29px] text-[14px] leading-[1.6] text-muted">
        {isSignup ? 'Create an account and bring your people together.' : 'Pick up right where your people left off.'}
      </p>

      <div className="mb-[25px] grid grid-cols-2 gap-1 rounded-[7px] border border-line bg-soft p-1" role="tablist" aria-label="Account action">
        <Link role="tab" aria-selected={!isSignup} className={`flex min-h-[38px] items-center justify-center rounded-[4px] px-3 py-[7px] text-[12px] font-semibold text-[#69756d] no-underline transition-colors ${!isSignup ? 'bg-white text-ink shadow-[0_1px_4px_rgba(29,50,40,0.1)]' : ''}`} to="/">Sign in</Link>
        <Link role="tab" aria-selected={isSignup} className={`flex min-h-[38px] items-center justify-center rounded-[4px] px-3 py-[7px] text-[12px] font-semibold text-[#69756d] no-underline transition-colors ${isSignup ? 'bg-white text-ink shadow-[0_1px_4px_rgba(29,50,40,0.1)]' : ''}`} to="/signup">Create account</Link>
      </div>

      <form className="grid gap-[17px]" onSubmit={handleSubmit}>
        {isSignup && (
          <div className="grid grid-cols-2 gap-[13px] max-[370px]:gap-[9px]">
            <label className="grid min-w-0 gap-[7px] text-[12px] font-semibold text-[#34463c]">
              <span>First name</span>
              <input className="h-[47px] w-full rounded-[5px] border border-[#dfe3db] bg-white/80 px-[13px] text-[13px] font-normal text-ink outline-none transition focus:border-[#56826b] focus:shadow-[0_0_0_3px_rgba(74,121,92,0.12)] placeholder:text-[#a3aaa3] max-[370px]:px-[10px]" name="first_name" autoComplete="given-name" placeholder="Jamie" required />
            </label>
            <label className="grid min-w-0 gap-[7px] text-[12px] font-semibold text-[#34463c]">
              <span>Last name</span>
              <input className="h-[47px] w-full rounded-[5px] border border-[#dfe3db] bg-white/80 px-[13px] text-[13px] font-normal text-ink outline-none transition focus:border-[#56826b] focus:shadow-[0_0_0_3px_rgba(74,121,92,0.12)] placeholder:text-[#a3aaa3] max-[370px]:px-[10px]" name="last_name" autoComplete="family-name" placeholder="Morgan" required />
            </label>
          </div>
        )}
        <label className="grid min-w-0 gap-[7px] text-[12px] font-semibold text-[#34463c]">
          <span>Email address</span>
          <input className="h-[47px] w-full rounded-[5px] border border-[#dfe3db] bg-white/80 px-[13px] text-[13px] font-normal text-ink outline-none transition focus:border-[#56826b] focus:shadow-[0_0_0_3px_rgba(74,121,92,0.12)] placeholder:text-[#a3aaa3]" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </label>
        <label className="grid min-w-0 gap-[7px] text-[12px] font-semibold text-[#34463c]">
          <span>Password</span>
          <span className="relative block">
            <input className="h-[47px] w-full rounded-[5px] border border-[#dfe3db] bg-white/80 px-[13px] pr-11 text-[13px] font-normal text-ink outline-none transition focus:border-[#56826b] focus:shadow-[0_0_0_3px_rgba(74,121,92,0.12)] placeholder:text-[#a3aaa3]" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="At least 8 characters" minLength="8" required />
            <button className="absolute top-1/2 right-[5px] grid size-9 -translate-y-1/2 place-items-center rounded text-[#78847c] transition hover:bg-soft hover:text-forest" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>

        {error && <p className="rounded-[4px] bg-error-bg px-3 py-2.5 text-[12px] leading-[1.5] text-error" role="alert">{error}</p>}
        {notice && <p className="rounded-[4px] bg-success-bg px-3 py-2.5 text-[12px] leading-[1.5] text-success" role="status">{notice}</p>}

        <button className="mt-0.5 flex min-h-[49px] items-center justify-center gap-2.5 rounded-[5px] bg-forest text-[13px] font-semibold text-white transition hover:-translate-y-px hover:bg-[#285342] disabled:cursor-wait disabled:opacity-65" type="submit" disabled={busy}>
          <span>{busy ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}</span>
          {!busy && <ArrowRight size={18} />}
        </button>
      </form>

      <GoogleSignIn />
      <p className="auth-legal">By continuing, you agree to keep this a thoughtful space for everyone.</p>
    </>
  )
}