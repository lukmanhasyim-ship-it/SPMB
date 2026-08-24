import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const storage: Record<string, string> = {}
  return {
    storage,
    loginMock: vi.fn(),
    registerMock: vi.fn(),
  }
})

vi.mock('../services/api', () => ({
  api: {
    auth: {
      login: mocks.loginMock,
      register: mocks.registerMock,
    },
  },
  getSessionToken: () => mocks.storage['token'] ?? '',
  setSessionToken: (token: string) => {
    if (token) mocks.storage['token'] = token
    else delete mocks.storage['token']
  },
  clearSessionToken: () => {
    delete mocks.storage['token']
  },
  getStoredUser: () => (mocks.storage['user'] ? JSON.parse(mocks.storage['user']) : null),
  writeStoredUser: (user: unknown) => {
    if (user) mocks.storage['user'] = JSON.stringify(user)
    else delete mocks.storage['user']
  },
}))

import { useAuthStore } from './authStore'

const EMAIL = 'pengguna@gmail.com'

function makeLoginResult(role: string) {
  return {
    status: 'ok',
    role,
    user: { email: EMAIL, nama: 'Pengguna', fotoUrl: '' },
    sessionToken: 'session-token-1',
  }
}

function resetStore() {
  useAuthStore.setState({
    user: null,
    isLoggedIn: false,
    registrationRequired: false,
    loading: false,
    error: null,
  })
}

beforeEach(() => {
  for (const key of Object.keys(mocks.storage)) delete mocks.storage[key]
  vi.clearAllMocks()
  resetStore()
})

describe('authStore.login', () => {
  it.each(['siswa', 'admin', 'guru', 'guru_smp', 'panitia_mpls'])(
    'role %s → login berhasil dan tersimpan',
    async (role) => {
      mocks.loginMock.mockResolvedValue(makeLoginResult(role))

      const result = await useAuthStore.getState().login(EMAIL, 'Pengguna')
      const state = useAuthStore.getState()

      expect(result).toBe(role)
      expect(state.isLoggedIn).toBe(true)
      expect(state.registrationRequired).toBe(false)
      expect(state.user?.role).toBe(role)
      expect(state.error).toBeNull()
      expect(mocks.storage['token']).toBe('session-token-1')
      const persisted = JSON.parse(mocks.storage['user'])
      expect(persisted.role).toBe(role)
    },
  )

  it('role new → tidak login, registrationRequired aktif, role tetap new (bukan admin)', async () => {
    mocks.loginMock.mockResolvedValue(makeLoginResult('new'))

    const result = await useAuthStore.getState().login(EMAIL)
    const state = useAuthStore.getState()

    expect(result).toBe('new')
    expect(state.isLoggedIn).toBe(false)
    expect(state.registrationRequired).toBe(true)
    expect(state.user).not.toBeNull()
    expect(state.user?.role).toBe('new')

    expect(mocks.storage['user']).toBeUndefined()
    expect(mocks.storage['token']).toBe('session-token-1')
  })

  it('role tak dikenal dari server difallback ke new, bukan admin', async () => {
    mocks.loginMock.mockResolvedValue(makeLoginResult('dewan_eksekutif'))

    const result = await useAuthStore.getState().login(EMAIL)
    const state = useAuthStore.getState()

    expect(result).toBe('new')
    expect(state.user?.role).toBe('new')
    expect(state.isLoggedIn).toBe(false)
  })

  it('respons status error dari API menghasilkan error dan null', async () => {
    mocks.loginMock.mockResolvedValue({ status: 'error' })

    const result = await useAuthStore.getState().login(EMAIL)

    expect(result).toBeNull()
    expect(useAuthStore.getState().error).toBe('Login gagal')
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
  })

  it('kegagalan jaringan ditangkap sebagai error store', async () => {
    mocks.loginMock.mockRejectedValue(new Error('Koneksi bermasalah'))

    const result = await useAuthStore.getState().login(EMAIL)

    expect(result).toBeNull()
    expect(useAuthStore.getState().error).toBe('Koneksi bermasalah')
  })
})

describe('authStore.restoreSession', () => {
  it('memulihkan sesi bila user + token tersedia', () => {
    mocks.storage['user'] = JSON.stringify({
      email: EMAIL,
      nama: 'Pengguna',
      role: 'siswa',
    })
    mocks.storage['token'] = 'tok'

    useAuthStore.getState().restoreSession()

    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(true)
    expect(state.registrationRequired).toBe(false)
    expect(state.user?.role).toBe('siswa')
  })

  it('membersihkan user tanpa token', () => {
    mocks.storage['user'] = JSON.stringify({
      email: EMAIL,
      nama: 'Pengguna',
      role: 'admin',
    })

    useAuthStore.getState().restoreSession()

    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(false)
    expect(state.user).toBeNull()
    expect(mocks.storage['user']).toBeUndefined()
    expect(mocks.storage['token']).toBeUndefined()
  })
})

describe('authStore.logout', () => {
  it('membersihkan seluruh state dan penyimpanan', () => {
    mocks.storage['user'] = JSON.stringify({ email: EMAIL, nama: 'P', role: 'admin' })
    mocks.storage['token'] = 'tok'
    useAuthStore.setState({
      user: { email: EMAIL, nama: 'P', role: 'admin' },
      isLoggedIn: true,
    })

    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isLoggedIn).toBe(false)
    expect(state.registrationRequired).toBe(false)
    expect(mocks.storage['user']).toBeUndefined()
    expect(mocks.storage['token']).toBeUndefined()
  })
})

describe('authStore.register', () => {
  it('registrasi siswa sukses → login otomatis sebagai siswa', async () => {
    mocks.registerMock.mockResolvedValue({
      status: 'ok',
      role: 'siswa',
      sessionToken: 'reg-token',
    })

    const result = await useAuthStore.getState().register(EMAIL, 'Budi', undefined, 'gtok')
    const state = useAuthStore.getState()

    expect(result).toBe('siswa')
    expect(state.isLoggedIn).toBe(true)
    expect(state.registrationRequired).toBe(false)
    expect(state.user?.role).toBe('siswa')
    expect(mocks.storage['token']).toBe('reg-token')
    expect(JSON.parse(mocks.storage['user']).email).toBe(EMAIL)
  })

  it('registrasi guru_smp sukses → role guru_smp', async () => {
    mocks.registerMock.mockResolvedValue({
      status: 'ok',
      role: 'guru_smp',
      sessionToken: 'reg-token-2',
    })

    const result = await useAuthStore
      .getState()
      .register(EMAIL, 'Guru Budi', undefined, 'gtok', { registerAs: 'guru_smp', asalSekolah: 'SMP 1' })

    expect(result).toBe('guru_smp')
    expect(useAuthStore.getState().user?.role).toBe('guru_smp')
    expect(useAuthStore.getState().user?.asal_sekolah).toBe('SMP 1')
  })

  it('registrasi gagal menyimpan pesan error lalu melempar ulang', async () => {
    mocks.registerMock.mockRejectedValue(new Error('Email sudah terdaftar'))

    await expect(useAuthStore.getState().register(EMAIL, 'Budi')).rejects.toThrow(
      'Email sudah terdaftar',
    )
    expect(useAuthStore.getState().error).toBe('Email sudah terdaftar')
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
  })
})
