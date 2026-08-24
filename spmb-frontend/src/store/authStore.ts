import { create } from 'zustand'
import type { User, Role } from '../types'
import {
  api,
  getSessionToken,
  setSessionToken,
  clearSessionToken,
  getStoredUser,
  writeStoredUser,
} from '../services/api'

const KNOWN_ROLES = ['siswa', 'admin', 'guru', 'guru_smp', 'panitia_mpls'] as const

function normalizeRole(raw: unknown): Role {
  if (typeof raw === 'string' && (KNOWN_ROLES as readonly string[]).includes(raw)) {
    return raw as Role
  }
  return 'new'
}

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  registrationRequired: boolean
  loading: boolean
  error: string | null

  restoreSession: () => void
  login: (email: string, nama?: string, fotoUrl?: string, idToken?: string) => Promise<Role | null>
  register: (
    email: string,
    nama: string,
    fotoUrl?: string,
    idToken?: string,
    opts?: { registerAs?: 'guru_smp'; noTelp?: string; asalSekolah?: string }
  ) => Promise<'siswa' | 'guru_smp'>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  registrationRequired: false,
  loading: false,
  error: null,

  restoreSession: () => {
    const user = getStoredUser<User>()
    if (user && getSessionToken()) {
      set({ user, isLoggedIn: true, registrationRequired: false })
    } else {
      clearSessionToken()
      writeStoredUser(null)
      set({ user: null, isLoggedIn: false, registrationRequired: false })
    }
  },

  login: async (email: string, nama?: string, fotoUrl?: string, idToken?: string) => {
    set({ loading: true, error: null })
    try {
      const result = await api.auth.login(email, nama, fotoUrl, idToken)

      if (result.status === 'ok') {
        const userData = result.user as { email: string; nama: string; fotoUrl?: string }
        const normalizedRole = normalizeRole(result.role)

        const sessionToken = result.sessionToken as string | undefined
        if (sessionToken) setSessionToken(sessionToken)

        const user: User = {
          email: userData.email,
          nama: userData.nama || userData.email,
          role: normalizedRole,
          fotoUrl: userData.fotoUrl || '',
          asal_sekolah: (userData as { asal_sekolah?: string }).asal_sekolah || '',
        }

        const loggedIn = normalizedRole !== 'new'
        set({
          user,
          isLoggedIn: loggedIn,
          registrationRequired: !loggedIn,
          loading: false,
        })

        writeStoredUser(loggedIn ? user : null)

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

  register: async (email: string, nama: string, fotoUrl?: string, idToken?: string, opts?: { registerAs?: 'guru_smp'; noTelp?: string; asalSekolah?: string }) => {
    set({ loading: true, error: null })
    try {
      const result = await api.auth.register(email, nama, fotoUrl, idToken, opts)

      if (result.status === 'ok') {
        const sessionToken = result.sessionToken as string | undefined
        if (sessionToken) setSessionToken(sessionToken)

        const serverRole = typeof result.role === 'string' ? result.role : ''
        const role = serverRole === 'guru_smp' ? 'guru_smp' : 'siswa'
        const user: User = {
          email,
          nama,
          role,
          fotoUrl: fotoUrl || '',
          asal_sekolah: opts?.asalSekolah || '',
        }
        writeStoredUser(user)
        set({ user, isLoggedIn: true, registrationRequired: false, loading: false })
        return role
      }
      return 'siswa'
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registrasi gagal'
      set({ loading: false, error: message })
      throw err
    }
  },

  logout: () => {
    clearSessionToken()
    writeStoredUser(null)
    set({ user: null, isLoggedIn: false, registrationRequired: false, error: null })
  },

  clearError: () => {
    set({ error: null })
  },
}))
