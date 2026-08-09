import { LayoutDashboard } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'

const navItems = [
  { to: '/guru/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

export default function GuruLayout() {
  return (
    <AppShell
      navItems={navItems}
      brandTitle="Guru SPMB"
      brandSubtitle="Panel Guru"
    />
  )
}
