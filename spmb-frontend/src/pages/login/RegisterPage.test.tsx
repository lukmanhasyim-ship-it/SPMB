import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import RegisterPage from './RegisterPage'

const mocks = vi.hoisted(() => ({
  registerMock: vi.fn(),
}))

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    isLoggedIn: false,
    registrationRequired: false,
    loading: false,
    error: null,
    register: mocks.registerMock,
  }),
}))

import {
  setPendingRegistration,
  clearPendingRegistration,
} from '../../services/pendingAuth'

const PENDING_KEY = 'spmb.pending-registration'

function seedValidPending() {
  setPendingRegistration({
    email: 'budi@gmail.com',
    nama: 'Budi Santoso',
    fotoUrl: '',
    token: 'valid-token',
  })
}

function seedExpiredPending() {
  seedValidPending()
  const raw = JSON.parse(localStorage.getItem(PENDING_KEY)!)
  raw.createdAt = Date.now() - 60 * 60 * 1000
  localStorage.setItem(PENDING_KEY, JSON.stringify(raw))
}

function renderRegister(initialEntry: string | { pathname: string; state?: unknown } = '/register') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<div>HOME_PAGE</div>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/student/dashboard" element={<div>STUDENT_DASHBOARD_REACHED</div>} />
        <Route path="/guru/dashboard" element={<div>GURU_DASHBOARD_REACHED</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  clearPendingRegistration()
})

afterEach(() => {
  cleanup()
})

describe('RegisterPage - status sesi', () => {
  it('menampilkan panduan saat sesi Google tidak ada sama sekali', () => {
    renderRegister()

    expect(screen.getByText(/sesi google tidak ditemukan/i)).toBeInTheDocument()
  })

  it('menampilkan banner kedaluwarsa dan memblokir submit', async () => {
    seedExpiredPending()
    const user = userEvent.setup()
    renderRegister()

    expect(screen.getByText(/sudah kedaluwarsa/i)).toBeInTheDocument()
    expect(screen.queryByDisplayValue('budi@gmail.com')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /daftar & mulai pendaftaran/i }))

    expect(await screen.findByText(/tidak ditemukan atau sudah kedaluwarsa/i)).toBeInTheDocument()
    expect(mocks.registerMock).not.toHaveBeenCalled()
  })
})

describe('RegisterPage - pra-isi data', () => {
  it('mengisi form dari pending registration di localStorage', () => {
    seedValidPending()
    renderRegister()

    expect(screen.getByDisplayValue('budi@gmail.com')).toBeDisabled()
    expect(screen.getByDisplayValue('Budi Santoso')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
  })

  it('location.state lebih diprioritaskan untuk pra-isi', () => {
    renderRegister({
      pathname: '/register',
      state: { email: 'dari-state@gmail.com', nama: 'Dari State', fotoUrl: '' },
    })

    expect(screen.getByDisplayValue('dari-state@gmail.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dari State')).toBeInTheDocument()
  })
})

describe('RegisterPage - validasi', () => {
  it('menolak submit tanpa nama', async () => {
    seedValidPending()
    const user = userEvent.setup()
    renderRegister()

    const namaInput = screen.getByLabelText(/nama lengkap/i)
    await user.clear(namaInput)
    await user.click(screen.getByRole('button', { name: /daftar & mulai pendaftaran/i }))

    expect(await screen.findByText(/nama lengkap harus diisi/i)).toBeInTheDocument()
    expect(mocks.registerMock).not.toHaveBeenCalled()
  })

  it('menolak guru_smp tanpa asal sekolah', async () => {
    seedValidPending()
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('button', { name: /guru smp\/mts/i }))
    await user.click(screen.getByRole('button', { name: /daftar sebagai guru smp/i }))

    expect(await screen.findByText(/asal sekolah.*wajib diisi/i)).toBeInTheDocument()
    expect(mocks.registerMock).not.toHaveBeenCalled()
  })
})

describe('RegisterPage - alur sukses', () => {
  it('registrasi siswa sukses → ke dashboard siswa, pending dibersihkan', async () => {
    seedValidPending()
    mocks.registerMock.mockResolvedValue('siswa')
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('button', { name: /daftar & mulai pendaftaran/i }))

    expect(await screen.findByText('STUDENT_DASHBOARD_REACHED')).toBeInTheDocument()
    expect(mocks.registerMock).toHaveBeenCalledWith(
      'budi@gmail.com',
      'Budi Santoso',
      undefined,
      'valid-token',
      undefined,
    )
    expect(localStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('registrasi guru_smp sukses → ke dashboard guru dengan opsi lengkap', async () => {
    seedValidPending()
    mocks.registerMock.mockResolvedValue('guru_smp')
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('button', { name: /guru smp\/mts/i }))
    await user.type(screen.getByLabelText(/asal sekolah/i), 'SMP Negeri 1 Sempu')
    await user.click(screen.getByRole('button', { name: /daftar sebagai guru smp/i }))

    expect(await screen.findByText('GURU_DASHBOARD_REACHED')).toBeInTheDocument()
    expect(mocks.registerMock).toHaveBeenCalledWith(
      'budi@gmail.com',
      'Budi Santoso',
      undefined,
      'valid-token',
      { registerAs: 'guru_smp', noTelp: undefined, asalSekolah: 'SMP Negeri 1 Sempu' },
    )
    expect(localStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('email sudah terdaftar → pesan tambahan ditampilkan', async () => {
    seedValidPending()
    mocks.registerMock.mockRejectedValue(new Error('Email sudah terdaftar'))
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('button', { name: /daftar & mulai pendaftaran/i }))

    expect(await screen.findByText(/hubungi admin/i)).toBeInTheDocument()
    expect(localStorage.getItem(PENDING_KEY)).not.toBeNull()
  })

  it('error tak terduga dipetakan ke pesan ramah', async () => {
    seedValidPending()
    mocks.registerMock.mockRejectedValue(new Error('Sesi tidak valid. Silakan login ulang.'))
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('button', { name: /daftar & mulai pendaftaran/i }))

    expect(await screen.findByText(/sesi anda berakhir/i)).toBeInTheDocument()
  })
})
