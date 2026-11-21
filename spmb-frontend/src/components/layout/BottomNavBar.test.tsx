import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { FileText } from 'lucide-react'
import BottomNavBar from './BottomNavBar'

function renderBar(props: Partial<Parameters<typeof BottomNavBar>[0]> = {}) {
  const onMenuClick = vi.fn()
  render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <BottomNavBar
        homeTo="/admin/dashboard"
        onMenuClick={onMenuClick}
        menuOpen={false}
        {...props}
      />
    </MemoryRouter>,
  )
  return { onMenuClick }
}

describe('BottomNavBar', () => {
  it('memakai navigation landmark yang diberi nama', () => {
    renderBar()
    expect(screen.getByRole('navigation', { name: 'Navigasi bawah' })).toBeInTheDocument()
  })

  it('menampilkan Beranda dan Lainnya tanpa pintasan', () => {
    renderBar()
    expect(screen.getByRole('link', { name: 'Beranda' })).toHaveAttribute('href', '/admin/dashboard')
    expect(screen.getByRole('button', { name: 'Lainnya' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Data Siswa' })).not.toBeInTheDocument()
  })

  it('memakai shortLabel di bar tanpa mengubah tujuan rute', () => {
    renderBar({
      shortcuts: [{ to: '/admin/siswa', icon: FileText, label: 'Data Siswa', shortLabel: 'Siswa' }],
    })
    expect(screen.getByRole('link', { name: 'Siswa' })).toHaveAttribute('href', '/admin/siswa')
    expect(screen.queryByRole('link', { name: 'Data Siswa' })).not.toBeInTheDocument()
  })

  it('menampilkan empat pintasan dan memakai label rapat', () => {
    renderBar({
      shortcuts: [
        { to: '/admin/siswa', icon: FileText, label: 'Data Siswa', shortLabel: 'Siswa' },
        { to: '/admin/daftarkan-siswa', icon: FileText, label: 'Daftarkan Siswa', shortLabel: 'Daftar' },
        { to: '/admin/cetak-kartu', icon: FileText, label: 'Cetak Kartu', shortLabel: 'Kartu' },
        { to: '/admin/gelombang', icon: FileText, label: 'Gelombang' },
      ],
    })
    expect(screen.getAllByRole('link')).toHaveLength(5)
    expect(screen.getByRole('link', { name: 'Beranda' }).className).toContain('text-[10px]')
    expect(screen.getByRole('button', { name: 'Lainnya' })).toBeInTheDocument()
  })

  it('tombol Lainnya membuka sheet dan melaporkan status expanded', async () => {
    const { onMenuClick } = renderBar()
    const more = screen.getByRole('button', { name: 'Lainnya' })
    expect(more).toHaveAttribute('aria-haspopup', 'dialog')
    expect(more).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(more)
    expect(onMenuClick).toHaveBeenCalledOnce()
  })

  it('menandai Beranda sebagai aktif pada rute beranda', () => {
    renderBar()
    expect(screen.getByRole('link', { name: 'Beranda' })).toHaveAttribute('aria-current', 'page')
  })

  it('menandai tombol Lainnya sebagai terbuka saat sheet aktif', () => {
    renderBar({ menuOpen: true })
    const more = screen.getByRole('button', { name: 'Lainnya' })
    expect(more).toHaveAttribute('aria-expanded', 'true')
    expect(more.className).toContain('bg-brand-green-dark')
  })

  it('membedakan afordansi tombol Lainnya dari item navigasi', () => {
    renderBar()
    const more = screen.getByRole('button', { name: 'Lainnya' })
    // Solid hijau + shadow + ikon 28px supaya tombol jelas dan mudah disentuh.
    expect(more.className).toContain('bg-brand-green')
    expect(more.className).toContain('text-white')
    expect(more.className).toContain('shadow-md')
    expect(more.className).toContain('font-semibold')
    expect(more.querySelector('svg')).toHaveClass('h-7')
  })

  it('memakai kelas target sentuh dan menyembunyikan bar saat cetak', () => {
    renderBar()
    const more = screen.getByRole('button', { name: 'Lainnya' })
    expect(more.className).toContain('min-h-[3.25rem]')
    expect(more.className).toContain('min-w-touch')

    const nav = screen.getByRole('navigation', { name: 'Navigasi bawah' })
    expect(nav.className).toContain('print:hidden')
    expect(nav.className).toContain('bottom-0')
  })
})
