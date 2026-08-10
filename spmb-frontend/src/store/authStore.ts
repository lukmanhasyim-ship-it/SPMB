import { create } from 'zustand'
import type { User } from '../types'
import { api, getSessionToken, setSessionToken, clearSessionToken } from '../services/api'

const SESSION_KEY = 'spmb.session'

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as User
    return user && user.email ? user : null
  } catch {
    return null
  }
}

function writeStoredUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  } catch {
    /* noop */
  }
}

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null

  restoreSession: () => void
  login: (email: string, nama?: string, fotoUrl?: string, idToken?: string) => Promise<'siswa' | 'admin' | 'guru' | 'panitia_mpls' | 'new' | null>
  register: (email: string, nama: string, fotoUrl?: string, idToken?: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  loading: false,
  error: null,

  restoreSession: () => {
    const user = readStoredUser()
    if (user && getSessionToken()) {
      set({ user, isLoggedIn: true })
    } else {
      clearSessionToken()
      writeStoredUser(null)
    }
  },

  login: async (email: string, nama?: string, fotoUrl?: string, idToken?: string) => {
    set({ loading: true, error: null })
    try {
      const result = await api.auth.login(email, nama, fotoUrl, idToken)

      if (result.status === 'ok') {
        const userData = result.user as { email: string; nama: string; fotoUrl?: string }
        const role = result.role as string
        const normalizedRole: 'siswa' | 'admin' | 'guru' | 'panitia_mpls' | 'new' =
          role === 'siswa' ? 'siswa'
          : role === 'new' ? 'new'
          : role === 'guru' ? 'guru'
          : role === 'panitia_mpls' ? 'panitia_mpls'
          : 'admin'

        const sessionToken = result.sessionToken as string | undefined
        if (sessionToken) setSessionToken(sessionToken)

        const user: User = {
          email: userData.email,
          nama: userData.nama || userData.email,
          role: normalizedRole === 'siswa' ? 'siswa' : normalizedRole === 'guru' ? 'guru' : normalizedRole === 'panitia_mpls' ? 'panitia_mpls' : 'admin',
          fotoUrl: userData.fotoUrl || '',
        }

        const loggedIn = normalizedRole !== 'new'
        set({
          user,
          isLoggedIn: loggedIn,
          loading: false,
        })

        if (loggedIn) writeStoredUser(user)

        return normalizedRole
      }

      set({ loading: false, error: 'Login gagal' })
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login gagal'
      set({ loading: false, error: message })
      return null
    }
  },

  register: async (email: string, nama: string, fotoUrl?: string, idToken?: string) => {
    set({ loading: true, error: null })
    try {
      const result = await api.auth.register(email, nama, fotoUrl, idToken)

      if (result.status === 'ok') {
        const sessionToken = result.sessionToken as string | undefined
        if (sessionToken) setSessionToken(sessionToken)

        const user: User = {
          email,
          nama,
          role: 'siswa',
          fotoUrl: fotoUrl || '',
        }
        writeStoredUser(user)
        set({ user, isLoggedIn: true, loading: false })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registrasi gagal'
      set({ loading: false, error: message })
      throw err
    }
  },

  logout: () => {
    clearSessionToken()
    writeStoredUser(null)
    set({ user: null, isLoggedIn: false, error: null })
  },

  clearError: () => {
    set({ error: null })
  },
}))
