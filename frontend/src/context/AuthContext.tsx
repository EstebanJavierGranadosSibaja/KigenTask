import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiRequest } from '../lib/api'
import type { AuthResponse, UserProfile } from '../types/api'
import { AuthContext, type AuthContextValue } from './auth-context'

const TOKEN_STORAGE_KEY = 'kg_token'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  const fetchProfile = useCallback(async (currentToken: string) => {
    return apiRequest<UserProfile>('/users/me', { method: 'GET' }, currentToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      const authResponse = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password }),
      })

      localStorage.setItem(TOKEN_STORAGE_KEY, authResponse.token)
      setToken(authResponse.token)

      const profile = await fetchProfile(authResponse.token)
      setUser(profile)
    },
    [fetchProfile],
  )

  useEffect(() => {
    let active = true

    async function bootstrap() {
      if (!token) {
        if (active) {
          setUser(null)
          setBootstrapping(false)
        }
        return
      }

      try {
        const profile = await fetchProfile(token)
        if (active) {
          setUser(profile)
        }
      } catch {
        if (active) {
          logout()
        }
      } finally {
        if (active) {
          setBootstrapping(false)
        }
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [fetchProfile, logout, token])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      bootstrapping,
      login,
      logout,
    }),
    [bootstrapping, login, logout, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
