import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api.js'
import AuthContext from './AuthContextValue.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userLoggedIn, setUserLoggedIn] = useState(null)
  const [googleClientId, setGoogleClientId] = useState('')

  useEffect(() => {
    let active = true

    api.get('/config')
      .then(({ data }) => {
        if (active) setGoogleClientId(data.googleClientId || '')
      })
      .catch(() => {})

    api.get('/me')
      .then(({ data }) => {
        if (!active) return
        setUser(data.user)
        setUserLoggedIn(true)
      })
      .catch(() => {
        if (active) setUserLoggedIn(false)
      })

    return () => { active = false }
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/login', credentials)
    setUser(data.user)
    setUserLoggedIn(true)
    return data.user
  }, [])

  const signup = useCallback(async (details) => {
    const { data } = await api.post('/signup', details)
    return data
  }, [])

  const googleLogin = useCallback(async (credential) => {
    const { data } = await api.post('/google', { credential })
    setUser(data.user)
    setUserLoggedIn(true)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await api.post('/logout')
    setUser(null)
    setUserLoggedIn(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, userLoggedIn, googleClientId, login, signup, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
