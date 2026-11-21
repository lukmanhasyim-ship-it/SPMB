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

  it('menampilkan Beranda dan Menu tanpa aksi utama', () => {
    renderBar()
    expect(screen.getByRole('link', { name: 'Beranda' })).toHaveAttribute('href', '/admin/dashboard')
    expect(screen.getByRole('button', { name: 'Buka menu' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Data Siswa' })).not.toBeInTheDocument()
  })

  it('menampilkan aksi utama sesuai role', () => {
    renderBar({
      primaryAction: { to: '/admin/siswa', icon: FileText, label: 'Data Siswa' },
    })
    expect(screen.getByRole('link', { name: 'Data Siswa' })).toHaveAttribute('href', '/admin/siswa')
  })

  it('tombol Menu membuka sheet dan melaporkan status expanded', async () => {
    const { onMenuClick } = renderBar()
    const menu = screen.getByRole('button', { name: 'Buka menu' })
    expect(menu).toHaveAttribute('aria-haspopup', 'dialog')
    expect(menu).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(menu)
    expect(onMenuClick).toHaveBeenCalledOnce()
  })

  it('menandai Beranda sebagai aktif pada rute beranda', () => {
    renderBar()
    expect(screen.getByRole('link', { name: 'Beranda' })).toHaveAttribute('aria-current', 'page')
  })

  it('memakai kelas target sentuh dan menyembunyikan bar saat cetak', () => {
    renderBar()
    const menu = screen.getByRole('button', { name: 'Buka menu' })
    expect(menu.className).toContain('min-h-touch')

    const nav = screen.getByRole('navigation', { name: 'Navigasi bawah' })
    expect(nav.className).toContain('print:hidden')
    expect(nav.className).toContain('bottom-0')
  })
})
