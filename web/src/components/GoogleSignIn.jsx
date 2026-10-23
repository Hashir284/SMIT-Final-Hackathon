import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth.js'

let googleSdkPromise

function loadGoogleSdk() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  if (!googleSdkPromise) {
    googleSdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => resolve(window.google)
      script.onerror = () => reject(new Error('Google sign-in could not be loaded.'))
      document.head.appendChild(script)
    })
  }
  return googleSdkPromise
}

export default function GoogleSignIn() {
  const { googleClientId, googleLogin } = useAuth()
  const navigate = useNavigate()
  const buttonRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!googleClientId) return undefined
    let active = true
    const buttonElement = buttonRef.current

    loadGoogleSdk()
      .then((google) => {
        if (!active || !buttonElement) return
        buttonElement.replaceChildren()
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            setError('')
            try {
              await googleLogin(credential)
              navigate('/', { replace: true })
            } catch (requestError) {
              setError(requestError.response?.data?.message || 'Google sign-in failed. Please try again.')
            }
          },
        })
        google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          width: Math.min(440, buttonElement.clientWidth || 440),
        })
      })
      .catch(() => {
        if (active) setError('Google sign-in could not be loaded. Check your connection or continue with email.')
      })

    return () => {
      active = false
      buttonElement?.replaceChildren()
    }
  }, [googleClientId, googleLogin, navigate])

  if (!googleClientId) return null

  return (
    <>
      <div className="my-6 flex items-center gap-3.25 text-[11px] text-[#939b93] before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-['']"><span>or continue with</span></div>
      <div className="flex min-h-10.5 justify-center overflow-hidden [&_iframe]:max-w-full" ref={buttonRef} />
      {error && <p className="rounded-sm bg-error-bg px-3 py-2.5 text-[12px] leading-normal text-error" role="alert">{error}</p>}
    </>
  )
}