import { Home, Menu } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { ComponentType } from 'react'
import { createPortal } from 'react-dom'

export interface BottomNavAction {
  to: string
  icon: ComponentType<{ className?: string }>
  label: string
}

export interface BottomNavBarProps {
  /** Rute beranda role (item pertama dari navItems). */
  homeTo: string
  /** Aksi utama spesifik role. Bila kosong, bar hanya berisi Beranda + Menu. */
  primaryAction?: BottomNavAction
  onMenuClick: () => void
  menuOpen: boolean
  /** Kontrol breakpoint: 'sm:hidden' untuk siswa, 'lg:hidden' untuk admin/guru/MPLS. */
  className?: string
}

function itemClass(isActive: boolean): string {
  return `flex min-h-touch min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium leading-tight transition-colors ${
    isActive
      ? 'bg-brand-green-light text-brand-green-dark'
      : 'text-slate-500 hover:bg-slate-50 hover:text-brand-green'
  }`
}

/**
 * Bilah navigasi bawah untuk layar sempit. Semua target sentuh minimal 44px
 * dan area aman iPhone (home indicator) dihormati lewat safe-area-inset.
 */
export default function BottomNavBar({
  homeTo,
  primaryAction,
  onMenuClick,
  menuOpen,
  className = 'sm:hidden',
}: BottomNavBarProps) {
  const PrimaryIcon = primaryAction?.icon

  // Portal ke body supaya `fixed` tidak pernah ter-contained oleh ancestor yang
  // sedang beranimasi (mis. `.page-fade-in` memakai transform saat fade-in 300ms).
  // Tanpa ini, bottom bar sempat menempel di bawah dokumen, bukan viewport.
  return createPortal(
    <nav
      aria-label="Navigasi bawah"
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur-md print:hidden ${className}`}
    >
      <div className="mx-auto flex w-full max-w-md items-stretch gap-1 px-2 pt-1">
        <NavLink to={homeTo} end className={({ isActive }) => itemClass(isActive)}>
          <Home className="h-5 w-5 shrink-0" />
          <span className="w-full truncate text-center">Beranda</span>
        </NavLink>

        {primaryAction && PrimaryIcon && (
          <NavLink to={primaryAction.to} className={({ isActive }) => itemClass(isActive)}>
            <PrimaryIcon className="h-5 w-5 shrink-0" />
            <span className="w-full truncate text-center">{primaryAction.label}</span>
          </NavLink>
        )}

        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Buka menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          className={itemClass(menuOpen)}
        >
          <Menu className="h-5 w-5 shrink-0" />
          <span className="w-full truncate text-center">Menu</span>
        </button>
      </div>
    </nav>,
    document.body,
  )
}
