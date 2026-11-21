import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import ResponsiveHeader from '../../components/layout/ResponsiveHeader'
import { useAuthStore } from '../../store/authStore'
import { useStudentStore } from '../../store/studentStore'
import { getStudentShortcuts, studentNavItems } from './navigation'

interface StudentShellProps {
  children: ReactNode
  /**
   * Dashboard menunda pintasan sampai data gelombang selesai dimuat.
   * Halaman lain tidak memerlukannya.
   */
  hideShortcuts?: boolean
}

/**
 * Shell bersama untuk seluruh halaman siswa. Memastikan header, bottom sheet,
 * dan bottom bar hadir secara konsisten di dashboard, wizard, maupun kartu.
 */
export default function StudentShell({ children, hideShortcuts = false }: StudentShellProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const data = useStudentStore((s) => s.data)
  const loading = useStudentStore((s) => s.loading)

  const shortcuts = getStudentShortcuts(data, loading || hideShortcuts)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const rightSlot = (
    <div className="flex items-center gap-2">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="truncate text-xs font-semibold text-slate-700">{user?.nama}</p>
        <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Keluar"
        className="flex min-h-touch min-w-touch items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Keluar</span>
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <ResponsiveHeader
        brandTitle="Portal Calon Siswa"
        brandSubtitle="SMKS Al Azhar Sempu"
        navItems={studentNavItems}
        shortcuts={shortcuts}
        rightSlot={rightSlot}
      />
      {/* Ruang untuk bottom bar di layar sempit; dihapus saat cetak. */}
      <main className="pb-24 sm:pb-6 print:p-0">{children}</main>
    </div>
  )
}
