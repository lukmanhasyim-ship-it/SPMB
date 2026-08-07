import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/login/LoginPage'
import RegisterPage from './pages/login/RegisterPage'

const DashboardSiswa = lazy(() => import('./pages/student/DashboardSiswa'))
const StudentWizard = lazy(() => import('./pages/student/StudentWizard'))
const KartuPendaftaran = lazy(() => import('./pages/student/KartuPendaftaran'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminSiswa = lazy(() => import('./pages/admin/AdminSiswa'))
const AdminDaftarSiswa = lazy(() => import('./pages/admin/AdminDaftarSiswa'))
const AdminReferral = lazy(() => import('./pages/admin/AdminReferral'))
const AdminGelombang = lazy(() => import('./pages/admin/AdminGelombang'))
const AdminTimeline = lazy(() => import('./pages/admin/AdminTimeline'))
const AdminBroadcast = lazy(() => import('./pages/admin/AdminBroadcast'))
const AdminFormulir = lazy(() => import('./pages/admin/AdminFormulir'))
const AdminManajemen = lazy(() => import('./pages/admin/AdminManajemen'))
const GuruDashboard = lazy(() => import('./pages/guru/GuruDashboard'))
const MplsLayout = lazy(() => import('./pages/mpls/MplsLayout'))
const MplsDashboard = lazy(() => import('./pages/mpls/MplsDashboard'))
const MplsScan = lazy(() => import('./pages/mpls/MplsScan'))
const MplsInformasi = lazy(() => import('./pages/mpls/MplsInformasi'))

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="loader" /></div>}>
      <div className="page-fade-in">{children}</div>
    </Suspense>
  )
}

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'siswa' | 'admin' | 'guru' | 'panitia_mpls' }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const user = useAuthStore((s) => s.user)
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
            <SuspenseWrapper>
              <DashboardSiswa />
            </SuspenseWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/wizard"
        element={
          <ProtectedRoute role="siswa">
            <SuspenseWrapper>
              <StudentWizard />
            </SuspenseWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/kartu-pendaftaran"
        element={
          <ProtectedRoute role="siswa">
            <SuspenseWrapper>
              <KartuPendaftaran />
            </SuspenseWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <SuspenseWrapper>
              <AdminLayout />
            </SuspenseWrapper>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<SuspenseWrapper><AdminDashboard /></SuspenseWrapper>} />
        <Route path="siswa" element={<SuspenseWrapper><AdminSiswa /></SuspenseWrapper>} />
        <Route path="daftarkan-siswa" element={<SuspenseWrapper><AdminDaftarSiswa /></SuspenseWrapper>} />
        <Route path="referral" element={<SuspenseWrapper><AdminReferral /></SuspenseWrapper>} />
        <Route path="gelombang" element={<SuspenseWrapper><AdminGelombang /></SuspenseWrapper>} />
        <Route path="timeline" element={<SuspenseWrapper><AdminTimeline /></SuspenseWrapper>} />
        <Route path="broadcast" element={<SuspenseWrapper><AdminBroadcast /></SuspenseWrapper>} />
        <Route path="formulir" element={<SuspenseWrapper><AdminFormulir /></SuspenseWrapper>} />
        <Route path="admin-manajemen" element={<SuspenseWrapper><AdminManajemen /></SuspenseWrapper>} />
      </Route>
      <Route
        path="/guru"
        element={
          <ProtectedRoute role="guru">
            <SuspenseWrapper>
              <GuruDashboard />
            </SuspenseWrapper>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/guru/dashboard" replace />} />
        <Route path="dashboard" element={<SuspenseWrapper><GuruDashboard /></SuspenseWrapper>} />
      </Route>
      <Route
        path="/mpls"
        element={
          <ProtectedRoute role="panitia_mpls">
            <SuspenseWrapper>
              <MplsLayout />
            </SuspenseWrapper>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/mpls/dashboard" replace />} />
        <Route path="dashboard" element={<SuspenseWrapper><MplsDashboard /></SuspenseWrapper>} />
        <Route path="scan" element={<SuspenseWrapper><MplsScan /></SuspenseWrapper>} />
        <Route path="informasi" element={<SuspenseWrapper><MplsInformasi /></SuspenseWrapper>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
