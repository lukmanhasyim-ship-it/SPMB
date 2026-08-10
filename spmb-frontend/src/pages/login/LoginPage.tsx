import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, LogIn, User, School, MapPin, Users, Award, X, Loader2, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'

const LOGIN_JURUSAN = [
  { code: 'AKL', label: 'Akuntansi dan Keuangan Lembaga' },
  { code: 'TKR', label: 'Teknik Kendaraan Ringan' },
  { code: 'PPLG', label: 'Pengembangan Perangkat Lunak dan Gim' },
  { code: 'TJKT', label: 'Teknik Jaringan Komputer dan Telekomunikasi' },
  { code: 'DPB', label: 'Desain dan Produksi Busana' },
]

const CARA_DAFTAR_STEPS = [
  { icon: LogIn, title: 'Login dengan Google', desc: 'Klik tombol di atas menggunakan akun Gmail yang aktif' },
  { icon: User, title: 'Lengkapi data akun', desc: 'Isi nama lengkap dan upload foto profil' },
  { icon: School, title: 'Pilih jurusan', desc: 'Pilih kompetensi keahlian yang Anda minati' },
  { icon: MapPin, title: 'Isi data pribadi & alamat', desc: 'Lengkapi data pribadi, alamat, dan peta lokasi' },
  { icon: Users, title: 'Isi data orang tua/wali', desc: 'Lengkapi data ayah, ibu, atau wali' },
  { icon: Award, title: 'Unggah berkas & selesai', desc: 'Unggah pas foto, catat prestasi (opsional), lalu finalisasi — kartu bukti pendaftaran langsung terbit' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()
  const [internalLoading, setInternalLoading] = useState(false)
  const [caraDaftarOpen, setCaraDaftarOpen] = useState(false)

  const isLoading = loading || internalLoading

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
          try {
            sessionStorage.setItem('spmb.google-token', accessToken)
          } catch {
            /* noop */
          }
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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-br from-brand-green via-brand-green-dark to-brand-teal text-white">
        <div className="absolute -top-28 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="absolute -bottom-16 -right-20 w-80 h-80 rounded-full bg-brand-orange/25 blur-3xl animate-float-delayed" />
        <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full bg-brand-green-light/10 blur-2xl animate-float" />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-14">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden p-1">
                <img src="/logo white.svg" alt="Logo SMKS Al Azhar Sempu" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">SMKS AL AZHAR SEMPU</p>
                <p className="text-xs text-white/70">Sistem Penerimaan Murid Baru</p>
              </div>
            </div>
          </div>

          <div className="my-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium mb-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              Sistem Penerimaan Murid Baru
            </div>
            <h1 className="text-3xl xl:text-[2.6rem] font-extrabold leading-[1.15] animate-fade-in-up" style={{ animationDelay: '160ms' }}>
              SMK BERKAH,
              <br />
              MASA DEPAN CERAH <span className="text-brand-orange">Dimulai </span> dari SPMB Sekarang.
            </h1>
            <p className="mt-5 text-white/80 leading-relaxed max-w-md animate-fade-in-up" style={{ animationDelay: '240ms' }}>
              Daftar online, pilih jurusan impian, dan bergabung bersama keluarga besar
              SMKS AL AZHAR SEMPU. Proses cepat, mudah, dan sepenuhnya digital.
            </p>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-4">
              Kompetensi Keahlian
            </p>
            <div className="flex flex-wrap gap-2">
              {LOGIN_JURUSAN.map((j, i) => (
                <span
                  key={j.code}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-xs font-semibold hover:bg-white/20 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-brand-orange text-brand-teal text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {j.label}
                </span>
              ))}
            </div>

          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-slate-50">
        <Card className="w-full max-w-md p-8">
          <div className="lg:hidden text-center mb-8 animate-fade-in-up">
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

          <div className="hidden lg:block text-center mb-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-slate-800">Masuk</h2>
            <p className="text-sm text-slate-500 mt-1">
              Lanjutkan pendaftaran dengan akun Google Anda
            </p>
          </div>

          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <button
              onClick={handleGoogleClick}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400 shrink-0" />
              ) : (
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
              )}
              {isLoading ? 'Memproses...' : 'Masuk dengan Google'}
            </button>

            <p className="text-xs text-slate-400 text-center">
              Hanya dengan akun Gmail yang aktif
            </p>

            <button
              onClick={() => setCaraDaftarOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-brand-green/30 bg-brand-green-light/20 hover:bg-brand-green-light/40 active:scale-[0.98] transition-all text-sm font-semibold text-brand-green-dark"
            >
              <Info className="w-4 h-4" />
              Cara Daftar Pendaftaran
            </button>
          </div>

          <p className="text-[11px] text-slate-300 text-center mt-8">
            © {new Date().getFullYear()} SMKS AL AZHAR SEMPU — SPMB
          </p>
          <p className="text-[11px] text-slate-400 text-center mt-1">
            www.smkalazharsempu.sch.id | @smkalazharsempu
          </p>
        </Card>
      </div>

      {caraDaftarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-in"
          onClick={() => setCaraDaftarOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto animate-modal-pop"
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
              {CARA_DAFTAR_STEPS.map(({ icon: Icon, title, desc }, index) => (
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
