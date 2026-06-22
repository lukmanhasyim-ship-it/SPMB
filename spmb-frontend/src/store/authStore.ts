import { create } from 'zustand';
import type { User } from '../types';
import { SISTEM_CONFIG } from '../data/dummy';

interface RegisteredUser {
  email: string;
  nama: string;
  fotoProfilBase64?: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  registeredUsers: RegisteredUser[];
  register: (email: string, nama: string, fotoBase64?: string) => void;
  googleLogin: (email: string, nama: string, fotoUrl?: string) => 'siswa' | 'admin' | null;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  registeredUsers: [],

  register: (email: string, nama: string, fotoBase64?: string) => {
    const { registeredUsers } = get();
    const exists = registeredUsers.some((u) => u.email === email);
    if (!exists) {
      set({ registeredUsers: [...registeredUsers, { email, nama, fotoProfilBase64: fotoBase64 }] });
    }
    const role = SISTEM_CONFIG.ADMIN_EMAIL_LIST.includes(email) ? 'admin' : 'siswa';
    set({
      user: { email, nama, role, fotoUrl: fotoBase64 },
      isLoggedIn: true,
    });
  },

  googleLogin: (email: string, nama: string, fotoUrl?: string) => {
    const { registeredUsers } = get();

    if (SISTEM_CONFIG.ADMIN_EMAIL_LIST.includes(email)) {
      set({ user: { email, nama, role: 'admin', fotoUrl }, isLoggedIn: true });
      return 'admin';
    }

    const existing = registeredUsers.find((u) => u.email === email);
    if (existing) {
      set({
        user: { email, nama: existing.nama, role: 'siswa', fotoUrl: existing.fotoProfilBase64 || fotoUrl },
        isLoggedIn: true,
      });
      return 'siswa';
    }

    return null;
  },

  logout: () => {
    set({ user: null, isLoggedIn: false });
  },
}));
