import { LayoutDashboard, Users, Calendar, Image, FileText, Shield, UserPlus, Milestone, UserCheck, CreditCard } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/siswa', icon: Users, label: 'Data Siswa' },
  { to: '/admin/daftarkan-siswa', icon: UserPlus, label: 'Daftarkan Siswa' },
  { to: '/admin/referral', icon: UserCheck, label: 'Referral' },
  { to: '/admin/gelombang', icon: Calendar, label: 'Gelombang' },
  { to: '/admin/timeline', icon: Milestone, label: 'Timeline' },
  { to: '/admin/broadcast', icon: Image, label: 'Postingan' },
  { to: '/admin/formulir', icon: FileText, label: 'Formulir' },
  { to: '/admin/cetak-kartu', icon: CreditCard, label: 'Cetak Kartu' },
  { to: '/admin/admin-manajemen', icon: Shield, label: 'User' },
]

const shortcuts = [
  { ...navItems[1], shortLabel: 'Siswa' },
  { ...navItems[2], shortLabel: 'Daftar' },
  { ...navItems[8], shortLabel: 'Kartu' },
  { ...navItems[4], shortLabel: 'Gelombang' },
]

export default function AdminLayout() {
  return (
    <AppShell
      navItems={navItems}
      brandTitle="Admin SPMB"
      brandSubtitle="Panel Administrasi"
      shortcuts={shortcuts}
    />
  )
}
