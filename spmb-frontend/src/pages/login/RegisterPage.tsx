import { useState, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { UserPlus, Upload, Camera, GraduationCap, School } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import InputField from '../../components/ui/InputField'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register, loading, error } = useAuthStore()
  const googleData = location.state as { email?: string; nama?: string; fotoUrl?: string } | null

  const [nama, setNama] = useState(googleData?.nama || '')
  const [email, setEmail] = useState(googleData?.email || '')
  const [fotoBase64, setFotoBase64] = useState(googleData?.fotoUrl || '')
  const [peran, setPeran] = useState<'siswa' | 'guru_smp'>('siswa')
  const [noTelp, setNoTelp] = useState('')
  const [asalSekolah, setAsalSekolah] = useState('')
  const [localError, setLocalError] = useState('')
  const fotoRef = useRef<HTMLInputElement>(null)
  const fromGoogle = !!(googleData?.email)

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setLocalError('Ukuran foto maksimal 2MB')
      return
    }
    const base64 = await fileToBase64(file)
    setFotoBase64(base64)
    setLocalError('')
  }

  const handleRegister = async () => {
    setLocalError('')

    const googleToken = sessionStorage.getItem('spmb.google-token') || ''
    if (!googleToken) {
      setLocalError('Sesi Google tidak ditemukan. Silakan login ulang dari halaman awal.')
      return
    }

    if (!nama.trim()) {
      setLocalError('Nama lengkap harus diisi')
      return
    }
    if (!email.trim()) {
      setLocalError('Alamat email harus diisi')
      return
    }
    if (!email.toLowerCase().includes('@gmail.com')) {
      setLocalError('Gunakan alamat Gmail (@gmail.com) yang aktif')
      return
    }
    if (peran === 'guru_smp' && !asalSekolah.trim()) {
      setLocalError('Asal sekolah (SMP/MTs) wajib diisi')
      return
    }
    try {
      const role = await register(
        email.trim(),
        nama.trim(),
        peran === 'guru_smp' ? undefined : (fotoBase64 || undefined),
        googleToken,
        peran === 'guru_smp'
          ? {
              registerAs: 'guru_smp',
              noTelp: noTelp.trim() || undefined,
              asalSekolah: asalSekolah.trim(),
            }
          : undefined
      )
      try {
        sessionStorage.removeItem('spmb.google-token')
      } catch {
        /* noop */
      }
      navigate(role === 'guru_smp' ? '/guru/dashboard' : '/student/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : (error || '')
      if (msg.includes('sudah terdaftar')) {
        setLocalError(msg + '. Akun ini sudah terdaftar sebelumnya — hubungi admin untuk menghapus atau mengubah perannya.')
      } else {
        setLocalError(msg || 'Registrasi gagal')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center">
            <img src="/logo.svg" alt="Logo SMKS Al Azhar Sempu" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Akun</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistem Penerimaan Murid Baru
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            SMKS AL AZHAR SEMPU
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Daftar sebagai</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPeran('siswa')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all outline-none
                  ${peran === 'siswa'
                    ? 'border-brand-green bg-brand-green/5 ring-2 ring-brand-green/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <GraduationCap className={`w-6 h-6 ${peran === 'siswa' ? 'text-brand-green' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-800">Siswa Baru</span>
                <span className="text-[11px] text-slate-500 leading-snug">Calon murid baru SMKS</span>
              </button>
              <button
                type="button"
                onClick={() => setPeran('guru_smp')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all outline-none
                  ${peran === 'guru_smp'
                    ? 'border-brand-green bg-brand-green/5 ring-2 ring-brand-green/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <School className={`w-6 h-6 ${peran === 'guru_smp' ? 'text-brand-green' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-800">Guru SMP/MTs</span>
                <span className="text-[11px] text-slate-500 leading-snug">Bantu daftarkan siswa</span>
              </button>
            </div>
          </div>

          {peran === 'siswa' && (
            <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-brand-green transition-colors group"
              onClick={() => fotoRef.current?.click()}
            >
              {fotoBase64 ? (
                <img src={fotoBase64} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-slate-400 group-hover:text-brand-green transition-colors" />
              )}
            </div>
            <input
              ref={fotoRef}
              type="file"
              accept="image/*"
              onChange={handleUploadFoto}
              className="hidden"
            />
            <button
              onClick={() => fotoRef.current?.click()}
              className="text-xs text-brand-green hover:text-brand-green-dark font-medium flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              {fromGoogle ? 'Ganti Foto Profile' : 'Upload Foto Profile'}
            </button>
            <p className="text-[10px] text-slate-400">Maks 2MB, format JPG/PNG</p>
          </div>
          )}

          <InputField
            label="Nama Lengkap"
            name="nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama lengkap Anda"
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-slate-700">
                Alamat Email (Gmail)
              </label>
              {fromGoogle && (
                <span className="text-[10px] font-medium text-white bg-brand-green px-1.5 py-0.5 rounded">
                  Google
                </span>
              )}
            </div>
            <input
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@gmail.com"
              required
              disabled={fromGoogle}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none
                ${fromGoogle
                  ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-white border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 text-slate-800 placeholder:text-slate-400'
                }`}
            />
          </div>

          {peran === 'guru_smp' && (
            <>
              <InputField
                label="Asal Sekolah (SMP/MTs)"
                name="asalSekolah"
                value={asalSekolah}
                onChange={(e) => setAsalSekolah(e.target.value)}
                placeholder="cth: SMP Negeri 1 Sempu"
                required
              />
              <InputField
                label="No. HP/WhatsApp"
                name="noTelp"
                value={noTelp}
                onChange={(e) => setNoTelp(e.target.value)}
                placeholder="08xxxxxxxxxx (opsional)"
              />
            </>
          )}

          {(localError || error) && (
            <p className="text-sm text-red-500 text-center">{localError || error}</p>
          )}

          <Button
            onClick={handleRegister}
            fullWidth
            loading={loading}
            className="text-base py-3"
          >
            <UserPlus className="w-5 h-5" />
            {peran === 'guru_smp' ? 'Daftar sebagai Guru SMP/MTs' : 'Daftar & Mulai Pendaftaran'}
          </Button>
        </div>

        <p className="text-sm text-slate-500 text-center mt-6">
          Sudah punya akun?{' '}
          <Link to="/" className="text-brand-green hover:text-brand-green-dark font-medium">
            Masuk di sini
          </Link>
        </p>
      </Card>
    </div>
  )
}
