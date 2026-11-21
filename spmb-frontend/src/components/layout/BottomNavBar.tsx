import { Home, Menu } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { ComponentType } from 'react'
import { createPortal } from 'react-dom'

export interface BottomNavAction {
  to: string
  icon: ComponentType<{ className?: string }>
  label: string
  /** Label ringkas khusus bar; sheet dan breadcrumb tetap memakai `label`. */
  shortLabel?: string
}

export interface BottomNavBarProps {
  /** Rute beranda (selalu jadi item pertama). */
  homeTo: string
  /** Halaman yang dipin ke bar. Sisanya diakses lewat tombol Lainnya. */
  shortcuts?: BottomNavAction[]
  onMenuClick: () => void
  menuOpen: boolean
  /** Kontrol breakpoint: 'sm:hidden' untuk siswa, 'lg:hidden' untuk role lain. */
  className?: string
}

function itemClass(isActive: boolean, dense: boolean): string {
  return `flex min-h-[3.25rem] min-w-touch flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 leading-tight transition-colors ${
    dense ? 'text-[10px]' : 'text-[11px]'
  } ${
    isActive
      ? 'bg-brand-green-light text-brand-green-dark'
      : 'text-slate-500 hover:bg-slate-50 hover:text-brand-green'
  }`
}

/** Tombol Lainnya sengaja dibedakan: solid hijau + ikon lebih besar + shadow. */
function menuClass(open: boolean, dense: boolean): string {
  return `flex min-h-[3.25rem] min-w-touch flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 font-semibold leading-tight shadow-md shadow-brand-green/20 transition-colors ${
    dense ? 'text-[10px]' : 'text-xs'
  } ${
    open
      ? 'bg-brand-green-dark text-white'
      : 'bg-brand-green text-white hover:bg-brand-green-dark'
  }`
}

/**
 * Bilah navigasi bawah untuk layar sempit. Beranda + pintasan + Lainnya
 * semuanya memiliki target sentuh 52px (di atas minimum 44px) dan menghormati
 * safe-area iPhone. Ikon Lainnya diperbesar supaya jelas sebagai tombol.
 */
export default function BottomNavBar({
  homeTo,
  shortcuts = [],
  onMenuClick,
  menuOpen,
  className = 'sm:hidden',
}: BottomNavBarProps) {
  // Portal ke body supaya `fixed` tidak pernah ter-contained oleh ancestor yang
  // sedang beranimasi (mis. `.page-fade-in` memakai transform saat fade-in 300ms).
  const dense = shortcuts.length >= 4

  return createPortal(
    <nav
      aria-label="Navigasi bawah"
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur-md print:hidden ${className}`}
    >
      <div
        className={`mx-auto flex w-full max-w-md items-stretch pt-1 ${
          dense ? 'gap-0.5 px-1' : 'gap-1 px-2'
        }`}
      >
        <NavLink to={homeTo} end className={({ isActive }) => itemClass(isActive, dense)}>
          <Home className="h-6 w-6 shrink-0" />
          <span className="w-full truncate text-center">Beranda</span>
        </NavLink>

        {shortcuts.map((shortcut) => (
          <NavLink key={shortcut.to} to={shortcut.to} className={({ isActive }) => itemClass(isActive, dense)}>
            <shortcut.icon className="h-6 w-6 shrink-0" />
            <span className="w-full truncate text-center">{shortcut.shortLabel ?? shortcut.label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Lainnya"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          className={menuClass(menuOpen, dense)}
        >
          <Menu className="h-7 w-7 shrink-0" strokeWidth={2.5} />
          <span className="w-full truncate text-center">Lainnya</span>
        </button>
      </div>
    </nav>,
    document.body,
  )
}
