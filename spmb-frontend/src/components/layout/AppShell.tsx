import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { ComponentType } from 'react'
import { useAuthStore } from '../../store/authStore'

export interface NavItem {
  to: string
  icon: ComponentType<{ className?: string }>
  label: string
}

interface AppShellProps {
  navItems: NavItem[]
  brandTitle: string
  brandSubtitle: string
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatTanggalWIB(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  return `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`
}

export default function AppShell({ navItems, brandTitle, brandSubtitle }: AppShellProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('spmb.sidebar-collapsed') === '1'
    } catch {
      return false
    }
  })

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('spmb.sidebar-collapsed', next ? '1' : '0')
      } catch {
        // ignore storage errors
      }
      return next
    })
  }

  const activeLabel = useMemo(() => {
    const exact = navItems.find((n) => n.to === location.pathname)
    if (exact) return exact.label
    const parent = navItems.find((n) => location.pathname.startsWith(n.to) && n.to !== '/')
    return parent?.label || brandTitle
  }, [navItems, location.pathname, brandTitle])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const avatar = (
    <div className="w-9 h-9 rounded-full ring-2 ring-white/30 overflow-hidden shrink-0 bg-white/15 flex items-center justify-center">
      {user?.fotoUrl ? (
        <img src={user.fotoUrl} alt={user?.nama || 'User'} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-bold text-white">
          {(user?.nama || 'U').charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )

  const brand = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
        <GraduationCap className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white leading-tight truncate">{brandTitle}</p>
        <p className="text-[11px] text-white/60 truncate">{brandSubtitle}</p>
      </div>
    </div>
  )

  const nav = (
    <nav className="flex-1 space-y-1 px-3 overflow-y-auto dash-scroll">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setDrawerOpen(false)}
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'text-white'
                : 'text-white/65 hover:text-white hover:bg-white/10'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-orange" />
              )}
              <span
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl ${
                  isActive ? 'bg-white/10 shadow-inner' : ''
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-brand-orange' : ''}`} />
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )

  const userFooter = (
    <div className="p-3 border-t border-white/10">
      <div className="flex items-center gap-3 mb-2 px-1">
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate">{user?.nama}</p>
          <p className="text-[11px] text-white/50 truncate">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Keluar
      </button>
    </div>
  )

  return (
    <div className="dash-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="dash-orb w-96 h-96 bg-brand-green/20 -top-24 -left-24 animate-float" />
        <div className="dash-orb w-80 h-80 bg-brand-teal/15 top-1/3 -right-24 animate-float-delayed" />
        <div className="dash-orb w-72 h-72 bg-brand-orange/15 bottom-0 left-1/3 animate-float" />
      </div>

      <div className="relative z-10 min-h-screen flex">
        <aside
          className={`hidden lg:flex flex-col shrink-0 self-start sticky top-0 h-screen z-30 bg-gradient-to-b from-brand-green via-brand-green-dark to-brand-teal overflow-hidden transition-[width] duration-300 ease-in-out ${
            collapsed ? 'w-0 border-transparent' : 'w-64 border-r border-white/10'
          }`}
        >
          <div className="flex flex-col h-full w-64 shrink-0">
            <div className="p-5 border-b border-white/10">{brand}</div>
            {nav}
            {userFooter}
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="hidden lg:flex sticky top-0 z-40 items-center justify-between gap-4 px-6 py-3.5 bg-white/55 backdrop-blur-md border-b border-white/70 print:hidden">
            <div className="flex items-center gap-1">
              <button
                onClick={toggleCollapsed}
                aria-label={collapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
                title={collapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
                className="p-2 rounded-xl text-slate-500 hover:bg-white/80 hover:text-brand-green transition-colors"
              >
                {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </button>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-green">
                SPMB
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-semibold text-slate-700">{activeLabel}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">{formatTanggalWIB()}</span>
              <div className="flex items-center gap-2.5">
                {avatar}
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-700 leading-tight">{user?.nama}</p>
                  <p className="text-[11px] text-slate-400 leading-tight">{user?.email}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 bg-white/70 backdrop-blur-md border-b border-white/70 print:hidden">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu"
              className="p-2 rounded-xl text-slate-600 hover:bg-white/80 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
              <GraduationCap className="w-4 h-4 text-brand-green shrink-0" />
              <span className="text-sm font-bold text-slate-800 truncate">{activeLabel}</span>
            </div>
            {avatar}
          </div>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>

      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-backdrop-in"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-brand-green via-brand-green-dark to-brand-teal flex flex-col animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              {brand}
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Tutup menu"
                className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {nav}
            {userFooter}
          </div>
        </div>
      )}
    </div>
  )
}
