import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import { useAuthStore } from './store/authStore'
import type { Role, User } from './types'

vi.mock('./pages/student/DashboardSiswa', () => ({
  default: () => <div>STUDENT_DASHBOARD_STUB</div>,
}))
vi.mock('./pages/student/StudentWizard', () => ({
  default: () => <div>WIZARD_STUB</div>,
}))
vi.mock('./pages/student/KartuPendaftaran', () => ({
  default: () => <div>KARTU_STUB</div>,
}))
vi.mock('./pages/admin/AdminLayout', () => ({
  default: () => <div>ADMIN_LAYOUT_STUB</div>,
}))
vi.mock('./pages/admin/AdminDashboard', () => ({
  default: () => <div>ADMIN_DASHBOARD_STUB</div>,
}))
vi.mock('./pages/guru/GuruLayout', () => ({
  default: () => <div>GURU_LAYOUT_STUB</div>,
}))
vi.mock('./pages/mpls/MplsLayout', () => ({
  default: () => <div>MPLS_LAYOUT_STUB</div>,
}))
vi.mock('./pages/mpls/MplsDashboard', () => ({
  default: () => <div>MPLS_DASHBOARD_STUB</div>,
}))

function loginAs(role: Role | null) {
  if (!role) {
    useAuthStore.setState({ user: null, isLoggedIn: false, registrationRequired: false })
    return
  }
  const user: User = { email: 'u@gmail.com', nama: 'Pengguna Uji', role }
  useAuthStore.setState({ user, isLoggedIn: true, registrationRequired: false })
}

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({
    user: null,
    isLoggedIn: false,
    registrationRequired: false,
    loading: false,
    error: null,
  })
})

describe('route guard & permission', () => {
  it('tamu yang membuka route siswa diarahkan ke halaman masuk', async () => {
    renderApp('/student/dashboard')

    expect(await screen.findByRole('button', { name: /masuk dengan google/i })).toBeInTheDocument()
    expect(screen.queryByText('STUDENT_DASHBOARD_STUB')).not.toBeInTheDocument()
  })

  it('siswa dapat mengakses dashboard siswa', async () => {
    loginAs('siswa')
    renderApp('/student/dashboard')

    expect(await screen.findByText('STUDENT_DASHBOARD_STUB')).toBeInTheDocument()
  })

  it('siswa ditolak mengakses panel admin', async () => {
    loginAs('siswa')
    renderApp('/admin/dashboard')

    expect(await screen.findByRole('button', { name: /masuk dengan google/i })).toBeInTheDocument()
    expect(screen.queryByText('ADMIN_LAYOUT_STUB')).not.toBeInTheDocument()
  })

  it('siswa ditolak mengakses panel guru', async () => {
    loginAs('siswa')
    renderApp('/guru/dashboard')

    expect(await screen.findByRole('button', { name: /masuk dengan google/i })).toBeInTheDocument()
  })

  it('siswa ditolak mengakses panel MPLS', async () => {
    loginAs('siswa')
    renderApp('/mpls/dashboard')

    expect(await screen.findByRole('button', { name: /masuk dengan google/i })).toBeInTheDocument()
  })

  it('admin dapat mengakses panel admin', async () => {
    loginAs('admin')
    renderApp('/admin/dashboard')

    expect(await screen.findByText('ADMIN_LAYOUT_STUB')).toBeInTheDocument()
  })

  it('guru_smp dapat mengakses panel guru', async () => {
    loginAs('guru_smp')
    renderApp('/guru/dashboard')

    expect(await screen.findByText('GURU_LAYOUT_STUB')).toBeInTheDocument()
  })

  it('panitia_mpls dapat mengakses panel MPLS', async () => {
    loginAs('panitia_mpls')
    renderApp('/mpls/dashboard')

    expect(await screen.findByText('MPLS_LAYOUT_STUB')).toBeInTheDocument()
  })

  it('role new diblokir dari semua route terproteksi', async () => {
    useAuthStore.setState({
      user: { email: 'baru@gmail.com', nama: 'Baru', role: 'new' },
      isLoggedIn: false,
      registrationRequired: true,
    })
    renderApp('/student/dashboard')

    expect(await screen.findByRole('button', { name: /masuk dengan google/i })).toBeInTheDocument()
    expect(screen.queryByText('STUDENT_DASHBOARD_STUB')).not.toBeInTheDocument()
  })

  it('path tak dikenal diarahkan ke halaman masuk', async () => {
    renderApp('/halaman-tidak-ada')

    expect(await screen.findByRole('button', { name: /masuk dengan google/i })).toBeInTheDocument()
  })
})

describe('banner sesi berakhir', () => {
  it('menampilkan banner saat query session=expired', async () => {
    renderApp('/?session=expired')

    expect(await screen.findByText(/sesi anda berakhir/i)).toBeInTheDocument()
  })

  it('tidak menampilkan banner tanpa query session', async () => {
    renderApp('/')

    await screen.findByRole('button', { name: /masuk dengan google/i })
    expect(screen.queryByText(/sesi anda berakhir/i)).not.toBeInTheDocument()
  })
})
