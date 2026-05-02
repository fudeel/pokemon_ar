// admin-frontend/context/AuthContext.tsx
'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { loginAdmin } from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'

interface AuthState {
  token: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, isLoading: true })

  useEffect(() => {
    const stored = localStorage.getItem('admin_token')
    setState({ token: stored, isLoading: false })
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginAdmin(username, password)
    localStorage.setItem('admin_token', data.token)
    setState({ token: data.token, isLoading: false })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token')
    setState({ token: null, isLoading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export { ApiError }
