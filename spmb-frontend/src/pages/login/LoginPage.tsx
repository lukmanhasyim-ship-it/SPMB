import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, LogIn, User, School, MapPin, Users, Award, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'

const isDevLoginEnabled = import.meta.env.DEV && import.meta.env.VITE_DEV_LOGIN === '1'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, devLogin, loading } = useAuthStore()
  const [internalLoading, setInternalLoading] = useState(false)
  const [devEmail, setDevEmail] = useState('')
  const [caraDaftarOpen, setCaraDaftarOpen] = useState(false)

  const isLoading = loading || internalLoading

  const handleDevLogin = (role: 'siswa' | 'admin' | 'guru' | 'panitia_mpls') => {
    devLogin(role, devEmail)
    navigate(role === 'admin' ? '/admin/dashboard' : role === 'guru' ? '/guru/dashboard' : role === 'panitia_mpls' ? '/mpls/dashboard' : '/student/dashboard')
  }

  const handleGoogleClick = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gis = (window as any).google?.accounts?.oauth2
    if (!gis) {
      console.error('GIS library not loaded yet')
      return
    }

    setInternalLoading(true)

    const cb = async (response: Record<string, unknown>) => {
      const accessToken = response.access_token as string | undefined
      if (!accessToken) {
        console.error('No access_token received')
        setInternalLoading(false)
        return
      }

      try {
        const userRes = await fetch(
          'https://openidconnect.googleapis.com/v1/userinfo',
          { headers: { Authorization: `Bearer ${accessToken}` } },
        )
        if (!userRes.ok) {
          throw new Error('Failed to fetch user info')
        }
        const userInfo = await userRes.json()

        const email = userInfo.email as string
        const nama = (userInfo.name as string) || ''
        const fotoUrl = (userInfo.picture as string) || ''

        const result = await login(email, nama, fotoUrl, accessToken)

        if (result === 'admin') {
          navigate('/admin/dashboard')
        } else if (result === 'siswa') {
          navigate('/student/dashboard')
        } else if (result === 'guru') {
          navigate('/guru/dashboard')
        } else if (result === 'panitia_mpls') {
          navigate('/mpls/dashboard')
        } else {
          navigate('/register', { state: { email, nama, fotoUrl } })
        }
      } catch (err) {
        console.error('Login error:', err)
        setInternalLoading(false)
      }
    }

    const client = gis.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: cb,
      error_callback: () => { setInternalLoading(false) },
    })

    client.requestAccessToken()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center">
            <img src="/logo.svg" alt="Logo SMKS Al Azhar Sempu" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SPMB</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistem Penerimaan Murid Baru
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            SMKS AL AZHAR SEMPU
          </p>
        </div>

        <button
          onClick={handleGoogleClick}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-dark shadow-sm hover:shadow-md transition-all text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? 'Memproses...' : 'Login dengan Google'}
        </button>

        <p className="text-xs text-slate-400 text-center mt-6">
          Lanjutkan dengan Google
        </p>

        <button
          onClick={() => setCaraDaftarOpen(true)}
          className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-brand-green/30 bg-brand-green-light/20 hover:bg-brand-green-light/40 text-sm font-semibold text-brand-green-dark transition-all"
        >
          <Info className="w-4 h-4" />
          Cara Daftar Pendaftaran
        </button>

        {isDevLoginEnabled && (
          <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 text-center mb-3">
              Mode Pengembangan - Bypass Login
            </p>
            <input
              type="email"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              placeholder="Email user (opsional)"
              className="w-full px-3 py-2 mb-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDevLogin('siswa')}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-sm font-medium text-white transition-all disabled:opacity-50"
              >
                Masuk sebagai Siswa
              </button>
              <button
                onClick={() => handleDevLogin('guru')}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-medium text-white transition-all disabled:opacity-50"
              >
                Masuk sebagai Guru
              </button>
              <button
                onClick={() => handleDevLogin('panitia_mpls')}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-sm font-medium text-white transition-all disabled:opacity-50"
              >
                Masuk sebagai Panitia MPLS
              </button>
              <button
                onClick={() => handleDevLogin('admin')}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-sm font-medium text-white transition-all disabled:opacity-50"
              >
                Masuk sebagai Admin
              </button>
            </div>
          </div>
        )}
      </Card>

      {caraDaftarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setCaraDaftarOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-brand-green shrink-0" />
                <h3 className="text-base font-bold text-slate-800">Cara Daftar</h3>
              </div>
              <button
                onClick={() => setCaraDaftarOpen(false)}
                aria-label="Tutup"
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Ikuti langkah berikut untuk mendaftar sebagai calon murid baru:
            </p>

            <ol className="space-y-3">
              {[
                { icon: LogIn, title: 'Login dengan Google', desc: 'Klik tombol di atas menggunakan akun Gmail yang aktif' },
                { icon: User, title: 'Lengkapi data akun', desc: 'Isi nama lengkap dan upload foto profil' },
                { icon: School, title: 'Pilih jurusan', desc: 'Pilih kompetensi keahlian yang Anda minati' },
                { icon: MapPin, title: 'Isi data pribadi & alamat', desc: 'Lengkapi data pribadi, alamat, dan peta lokasi' },
                { icon: Users, title: 'Isi data orang tua/wali', desc: 'Lengkapi data ayah, ibu, atau wali' },
                { icon: Award, title: 'Unggah berkas & selesai', desc: 'Unggah pas foto, catat prestasi (opsional), lalu finalisasi — kartu bukti pendaftaran langsung terbit' },
              ].map(({ icon: Icon, title, desc }, index) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-brand-green" />
                      {title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="bg-amber-50 rounded-xl p-3 mt-5">
              <p className="text-xs text-amber-800">
                Siapkan Gmail aktif, pas foto JPG/PNG maks 2MB, dan berkas fisik (KK, Akta, SKL) untuk diperiksa panitia SPMB.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
