import { LayoutDashboard, ScanLine, Image, ClipboardX } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'

const navItems = [
  { to: '/mpls/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mpls/scan', icon: ScanLine, label: 'Scan Absen' },
  { to: '/mpls/izin', icon: ClipboardX, label: 'Izin MPLS' },
  { to: '/mpls/informasi', icon: Image, label: 'Informasi' },
]

export default function MplsLayout() {
  return (
    <AppShell
      navItems={navItems}
      brandTitle="Panitia MPLS"
      brandSubtitle="Panel Panitia"
    />
  )
}
