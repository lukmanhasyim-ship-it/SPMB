import { useState, type ComponentType, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { GraduationCap, Menu } from 'lucide-react'
import Modal from '../ui/Modal'
import BottomNavBar from './BottomNavBar'

export interface HeaderNavItem {
  to: string
  icon: ComponentType<{ className?: string }>
  label: string
}

export interface ResponsiveHeaderProps {
  brandTitle: string
  brandSubtitle?: string
  /** Fallback bila tidak ada navItem yang cocok dengan rute aktif. */
  activeLabel?: string
  navItems?: HeaderNavItem[]
  /** Misalnya tombol logout atau avatar. */
  rightSlot?: ReactNode
  /** Aksi utama di bottom bar mobile. */
  primaryAction?: HeaderNavItem
}

/** Header bersama untuk area yang tidak memakai AppShell (siswa, auth). */
export default function ResponsiveHeader({
  brandTitle,
  brandSubtitle,
  activeLabel,
  navItems = [],
  rightSlot,
  primaryAction,
}: ResponsiveHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  const currentLabel = navItems.find((item) => location.pathname.startsWith(item.to))?.label
    ?? activeLabel
    ?? brandTitle

  const Brand = (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green/10">
        <GraduationCap className="h-5 w-5 text-brand-green" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight text-slate-800">{brandTitle}</p>
        {brandSubtitle && (
          <p className="truncate text-[11px] leading-tight text-slate-500">{brandSubtitle}</p>
        )}
      </div>
    </div>
  )

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-white/70 bg-white/80 px-3 py-2.5 backdrop-blur-md print:hidden sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {navItems.length > 0 && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu"
              className="hidden min-h-touch min-w-touch shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 sm:flex"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 sm:hidden">{Brand}</div>
          <div className="hidden min-w-0 sm:block">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-green">SPMB</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-700">{currentLabel}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">{rightSlot}</div>
      </header>

      {navItems.length > 0 && (
        <>
          <BottomNavBar
            homeTo={navItems[0].to}
            primaryAction={primaryAction}
            onMenuClick={() => setDrawerOpen(true)}
            menuOpen={drawerOpen}
            className="sm:hidden"
          />

          <Modal
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title="Navigasi utama"
            size="sm"
          >
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-brand-green">
              {brandTitle}
            </p>
            <nav aria-label="Daftar halaman" className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex min-h-touch items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-green-light text-brand-green-dark'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-brand-green'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            {brandSubtitle && (
              <p className="mt-4 border-t border-slate-100 px-3 pt-3 text-xs text-slate-400">
                {brandSubtitle}
              </p>
            )}
          </Modal>
        </>
      )}
    </>
  )
}
