import { useEffect, useState } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api.js'
import AuthLayout from '../components/AuthLayout.jsx'

export default function Dashboard() {
  const [access, setAccess] = useState(null)

  useEffect(() => {
    let active = true
    api.get('/admin-check')
      .then(() => { if (active) setAccess(true) })
      .catch(() => { if (active) setAccess(false) })
    return () => { active = false }
  }, [])

  return (
    <AuthLayout>
      <div className="pt-2">
        <div className="mb-7 grid size-[54px] place-items-center rounded-full border border-[#cbdcc2] bg-success-bg text-[#42664b]"><ShieldCheck size={27} strokeWidth={1.8} /></div>
        <p className="mb-[18px] text-[11px] leading-[1.3] font-bold text-muted uppercase">Commonroom</p>
        <h2 className="m-0 font-display text-[clamp(33px,3.3vw,43px)] leading-[1.12] font-normal text-ink max-[650px]:text-[36px]">Admin dashboard</h2>
        <p className="mt-3 mb-7 text-[14px] leading-[1.6] text-muted">
          {access === null ? 'Checking your access...' : access ? 'Admin access confirmed.' : 'We could not confirm admin access.'}
        </p>
        {access === false && <p className="mt-[18px] rounded-[4px] bg-error-bg px-3 py-2.5 text-[12px] leading-[1.5] text-error" role="alert">Your access may have changed. Return to your account and try again.</p>}
        <Link className="mt-6 flex min-h-[49px] w-full items-center justify-center gap-2.5 rounded-[5px] border border-line bg-transparent text-[13px] font-semibold text-ink no-underline transition hover:border-[#aab8aa] hover:bg-soft" to="/">
          <ArrowLeft size={17} />
          Back to account
        </Link>
      </div>
    </AuthLayout>
  )
}