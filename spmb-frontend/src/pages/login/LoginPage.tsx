import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'

interface MockAccount {
  email: string
  nama: string
  fotoUrl: string
  label: string
}

const MOCK_ACCOUNTS: MockAccount[] = [
  {
    email: 'ahmad.rizki@gmail.com',
    nama: 'Ahmad Rizki Pratama',
    fotoUrl: '',
    label: 'Sudah mendaftar',
  },
  {
    email: 'siti.nurul@gmail.com',
    nama: 'Siti Nurul Hidayah',
    fotoUrl: '',
    label: 'Sudah mendaftar',
  },
  {
    email: 'panitiapmb@gmail.com',
    nama: 'Panitia PMB',
    fotoUrl: '',
    label: 'Admin',
  },
  {
    email: 'new.siswa@gmail.com',
    nama: 'Budi Baru',
    fotoUrl: '',
    label: 'Belum mendaftar',
  },
]

function Avatar({ nama }: { nama: string }) {
  const initials = nama
    .split(' ')
    .map((kata) => kata[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-brand-green-light flex items-center justify-center text-brand-green-dark font-semibold text-sm shrink-0">
      {initials}
    </div>
  )
}

function GoogleAccountPicker({
  onSelect,
  onClose,
}: {
  onSelect: (account: MockAccount) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-slate-800">Pilih Akun Google</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-2 pb-2 max-h-80 overflow-y-auto">
          {MOCK_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              onClick={() => onSelect(account)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
            >
              <Avatar nama={account.nama} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{account.nama}</p>
                <p className="text-xs text-slate-500 truncate">{account.email}</p>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                  account.label === 'Admin'
                    ? 'bg-purple-100 text-purple-700'
                    : account.label === 'Sudah mendaftar'
                    ? 'bg-brand-green-light text-brand-green-dark'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {account.label}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>

        <div className="px-5 pb-5 pt-2 border-t border-slate-100">
          <button
            onClick={() =>
              onSelect({
                email: 'akun.baru@gmail.com',
                nama: 'Pengguna Baru',
                fotoUrl: '',
                label: '',
              })
            }
            className="w-full text-sm text-brand-green hover:text-brand-green-dark font-medium py-2 text-center"
          >
            + Gunakan akun lain
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { googleLogin } = useAuthStore()
  const [showPicker, setShowPicker] = useState(false)

  const handleSelectAccount = (account: MockAccount) => {
    setShowPicker(false)
    const result = googleLogin(account.email, account.nama, account.fotoUrl || undefined)
    if (result === 'admin') {
      navigate('/admin/dashboard')
    } else if (result === 'siswa') {
      navigate('/student/dashboard')
    } else {
      navigate('/register', { state: { email: account.email, nama: account.nama } })
    }
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
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-dark shadow-sm hover:shadow-md transition-all text-sm font-medium text-white"
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
          Lanjutkan dengan Google
        </button>

        <p className="text-xs text-slate-400 text-center mt-6">
          *Mode simulasi — data tidak terhubung ke server
        </p>
      </Card>

      {showPicker && (
        <GoogleAccountPicker
          onSelect={handleSelectAccount}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
