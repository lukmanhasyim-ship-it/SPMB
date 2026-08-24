import { LayoutDashboard, UserPlus } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { useAuthStore } from '../../store/authStore'

export default function GuruLayout() {
  const role = useAuthStore((s) => s.user?.role)
  const navItems = [
    { to: '/guru/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/guru/daftarkan-siswa', icon: UserPlus, label: 'Daftarkan Siswa' },
  ]

  return (
    <AppShell
      navItems={navItems}
      brandTitle="Guru SPMB"
      brandSubtitle={role === 'guru_smp' ? 'Panel Guru SMP/MTs' : 'Panel Guru'}
    />
  )
}
