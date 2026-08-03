import { create } from 'zustand'
import type { User } from '../types'
import { api } from '../services/api'

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null

  login: (email: string, nama?: string, fotoUrl?: string, idToken?: string) => Promise<'siswa' | 'admin' | 'guru' | 'panitia_mpls' | 'new' | null>
  devLogin: (role: 'siswa' | 'admin' | 'guru' | 'panitia_mpls', email?: string) => void
  register: (email: string, nama: string, fotoUrl?: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  loading: false,
  error: null,

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

        set({
          user: {
            email: userData.email,
            nama: userData.nama || userData.email,
            role: normalizedRole === 'siswa' ? 'siswa' : normalizedRole === 'guru' ? 'guru' : normalizedRole === 'panitia_mpls' ? 'panitia_mpls' : 'admin',
            fotoUrl: userData.fotoUrl || '',
          },
          isLoggedIn: normalizedRole !== 'new',
          loading: false,
        })

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

  devLogin: (role, email) => {
    const emailFinal = email?.trim() || `dev.${role}@spmb.local`
    set({
      user: {
        email: emailFinal,
        nama: email?.trim() ? `Dev (${role})` : `Dev ${role}`,
        role,
        fotoUrl: '',
      },
      isLoggedIn: true,
      loading: false,
      error: null,
    })
  },

  register: async (email: string, nama: string, fotoUrl?: string) => {
    set({ loading: true, error: null })
    try {
      const result = await api.auth.register(email, nama, fotoUrl)

      if (result.status === 'ok') {
        set({
          user: {
            email,
            nama,
            role: 'siswa',
            fotoUrl: fotoUrl || '',
          },
          isLoggedIn: true,
          loading: false,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registrasi gagal'
      set({ loading: false, error: message })
      throw err
    }
  },

  logout: () => {
    set({ user: null, isLoggedIn: false, error: null })
  },

  clearError: () => {
    set({ error: null })
  },
}))
