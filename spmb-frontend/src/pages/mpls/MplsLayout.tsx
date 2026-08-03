import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ScanLine, Image, LogOut, GraduationCap, Menu, X, Users } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { to: '/mpls/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mpls/scan', icon: ScanLine, label: 'Scan Absen' },
  { to: '/mpls/informasi', icon: Image, label: 'Informasi' },
]

export default function MplsLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-green-light rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Panitia MPLS</p>
              <p className="text-xs text-slate-500">Panel Panitia</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-green-light text-brand-green-dark shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2 px-3">
            <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-xs truncate">
              <p className="font-medium text-slate-700 truncate">{user?.nama}</p>
              <p className="text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-brand-green" />
          <span className="text-sm font-bold text-slate-800">Panitia MPLS</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-brand-green" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Panitia MPLS</p>
                  <p className="text-xs text-slate-500">{user?.nama}</p>
                </div>
              </div>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-brand-green-light text-brand-green-dark' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 md:pt-0 pt-[60px]">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
