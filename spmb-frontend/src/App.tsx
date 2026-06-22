import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/login/LoginPage'
import RegisterPage from './pages/login/RegisterPage'
import DashboardSiswa from './pages/student/DashboardSiswa'
import StudentWizard from './pages/student/StudentWizard'
import KartuPendaftaran from './pages/student/KartuPendaftaran'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSiswa from './pages/admin/AdminSiswa'
import AdminGelombang from './pages/admin/AdminGelombang'
import AdminBroadcast from './pages/admin/AdminBroadcast'
import AdminManajemen from './pages/admin/AdminManajemen'
import type { ReactNode } from 'react'

function ProtectedRoute({ children, role }: { children: ReactNode; role: 'siswa' | 'admin' }) {
  const { isLoggedIn, user } = useAuthStore()
  if (!isLoggedIn || !user) return <Navigate to="/" replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute role="siswa">
            <DashboardSiswa />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/wizard"
        element={
          <ProtectedRoute role="siswa">
            <StudentWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/kartu-pendaftaran"
        element={
          <ProtectedRoute role="siswa">
            <KartuPendaftaran />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="siswa" element={<AdminSiswa />} />
        <Route path="gelombang" element={<AdminGelombang />} />
        <Route path="broadcast" element={<AdminBroadcast />} />
        <Route path="admin-manajemen" element={<AdminManajemen />} />
      </Route>
    </Routes>
  )
}

export default App
