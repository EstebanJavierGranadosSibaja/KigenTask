import { createContext } from 'react'
import type { UserProfile } from '../types/api'

export type AuthContextValue = {
  token: string | null
  user: UserProfile | null
  bootstrapping: boolean
  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (payload: {
    username: string
    email: string
    password: string
    fullName?: string
  }) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)