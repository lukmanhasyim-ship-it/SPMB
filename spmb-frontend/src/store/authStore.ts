import { create } from 'zustand'
import type { User } from '../types'
import { api } from '../services/api'

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null

  login: (email: string, nama?: string, fotoUrl?: string, idToken?: string) => Promise<'siswa' | 'admin' | 'new' | null>
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
        const role = result.role as 'siswa' | 'admin' | 'new'

        set({
          user: {
            email: userData.email,
            nama: userData.nama || userData.email,
            role: role === 'admin' ? 'admin' : 'siswa',
            fotoUrl: userData.fotoUrl || '',
          },
          isLoggedIn: role !== 'new',
          loading: false,
        })

        return role
      }

      set({ loading: false, error: 'Login gagal' })
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login gagal'
      set({ loading: false, error: message })
      return null
    }
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
