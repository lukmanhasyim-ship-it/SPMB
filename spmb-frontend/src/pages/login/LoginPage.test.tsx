import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import LoginPage from './LoginPage'
import RegisterPage from '../login/RegisterPage'

const mocks = vi.hoisted(() => ({
  loginMock: vi.fn(),
  registerMock: vi.fn(),
}))

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    isLoggedIn: false,
    registrationRequired: false,
    loading: false,
    error: null,
    login: mocks.loginMock,
    register: mocks.registerMock,
  }),
}))

const PENDING_KEY = 'spmb.pending-registration'

function installGis(tokenResponse: Record<string, unknown> | null) {
  ;(window as unknown as Record<string, unknown>).google = {
    accounts: {
      oauth2: {
        initTokenClient: (config: { callback: (r: { access_token?: string }) => void }) => ({
          requestAccessToken: () => {
            if (tokenResponse) config.callback(tokenResponse)
          },
        }),
      },
    },
  }
}

function renderLogin(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  Reflect.deleteProperty(window as unknown as Record<string, unknown>, 'google')
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id')
})

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('LoginPage', () => {
  it('menampilkan tombol masuk dengan Google', () => {
    renderLogin()

    expect(screen.getByRole('button', { name: /masuk dengan google/i })).toBeInTheDocument()
  })

  it('menampilkan banner saat sesi berakhir', async () => {
    renderLogin('/?session=expired')

    expect(await screen.findByText(/sesi anda berakhir/i)).toBeInTheDocument()
  })

  it('menampilkan pesan konfigurasi saat client id kosong', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /masuk dengan google/i }))

    expect(await screen.findByText(/konfigurasi aplikasi belum lengkap/i)).toBeInTheDocument()
  })

  it('menampilkan pesan ramah saat Google Sign-In gagal dimuat', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /masuk dengan google/i }))

    expect(await screen.findByText(/gagal memuat google sign-in/i)).toBeInTheDocument()
  })

  it('alur pengguna baru: menyimpan pending lalu diarahkan ke register dengan data terisi', async () => {
    installGis({ access_token: 'fake-access-token' })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ email: 'baru@gmail.com', name: 'Pengguna Baru', picture: 'p.png' }),
      })),
    )
    mocks.loginMock.mockResolvedValue('new')
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /masuk dengan google/i }))

    const emailInput = await screen.findByDisplayValue('baru@gmail.com')
    expect(emailInput).toBeInTheDocument()
    expect(screen.getByDisplayValue('Pengguna Baru')).toBeInTheDocument()

    const pending = JSON.parse(localStorage.getItem(PENDING_KEY)!)
    expect(pending.email).toBe('baru@gmail.com')
    expect(pending.token).toBe('fake-access-token')
  })

  it('menampilkan pesan ramah saat login ditolak server', async () => {
    installGis({ access_token: 'fake-access-token' })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ email: 'lama@gmail.com', name: 'Lama', picture: '' }),
      })),
    )
    mocks.loginMock.mockRejectedValue(new Error('Email sudah terdaftar'))
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /masuk dengan google/i }))

    expect(await screen.findByText(/email ini sudah terdaftar/i)).toBeInTheDocument()
  })

  it('menampilkan pesan saat Google tidak mengembalikan token', async () => {
    installGis({})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ email: 'x@gmail.com', name: 'X', picture: '' }),
      })),
    )
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /masuk dengan google/i }))

    expect(await screen.findByText(/tidak mengembalikan token/i)).toBeInTheDocument()
    expect(mocks.loginMock).not.toHaveBeenCalled()
  })
})
