import { useNavigate } from 'react-router-dom'
import { LogOut, User, MessageCircle, FileText, UserCheck, MapPin } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useStudentStore } from '../../store/studentStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { DATA_GELOMBANG } from '../../data/dummy'

const statusStyle: Record<string, string> = {
  Draft: 'bg-amber-50 text-amber-700',
  Terdaftar: 'bg-blue-50 text-blue-700',
  Selesai: 'bg-brand-green-light text-brand-green-dark',
  Terverifikasi: 'bg-brand-green-light text-brand-green-dark',
}

export default function DashboardSiswa() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { data, steps, initRegistrasi, getProgressPercent } = useStudentStore()

  const isInitialized = data.idPendaftaran !== ''
  const progressPercent = getProgressPercent()
  const allComplete = steps.every((s) => s.selesai)
  const status = data.statusPendaftaran

  const gelombangAktif = DATA_GELOMBANG.find((g) => g.status === 'Aktif')
  const langkah123Selesai = steps[0].selesai && steps[1].selesai && steps[2].selesai

  const handleMulaiPendaftaran = () => {
    if (!isInitialized && user) {
      initRegistrasi(user.email)
    }
    navigate('/student/wizard?mode=awal')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const stepIcons = [FileText, UserCheck, MapPin]
  const stepLabels = ['Jurusan', 'Data Pribadi', 'Alamat & Peta']

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-green-light rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{user?.nama}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {gelombangAktif && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-green shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Pendaftaran {gelombangAktif.gelombang} — Tahun Ajaran {data.tahunAjaran || '2026/2027'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {gelombangAktif.tanggalMulai} s.d. {gelombangAktif.tanggalSelesai}
                  </p>
                </div>
              </div>
              {langkah123Selesai && (
                <a
                  href={gelombangAktif.linkGroupWA}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-brand-green-light text-brand-green-dark px-3 py-1.5 rounded-lg hover:bg-brand-green/20 transition-colors shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  Grup WA
                </a>
              )}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {!isInitialized ? 'Selamat Datang!' : status === 'Terdaftar' ? 'Pendaftaran Tersimpan' : 'Dashboard Pendaftaran'}
              </h2>
              <p className="text-sm text-slate-500">
                {!isInitialized
                  ? 'Silakan mulai pendaftaran Anda'
                  : status === 'Draft'
                  ? 'Lengkapi data pendaftaran awal'
                  : status === 'Terdaftar'
                  ? 'Data awal sudah disimpan. Lanjutkan finalisasi profile.'
                  : status === 'Selesai'
                  ? 'Pendaftaran sudah difinalisasi'
                  : 'Pendaftaran telah terverifikasi'}
              </p>
            </div>
            {isInitialized && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle[status] || 'bg-slate-100 text-slate-700'}`}>
                {status === 'Draft' ? 'Belum Lengkap' : status}
              </span>
            )}
          </div>

          {isInitialized && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress</span>
                <span>{steps.filter((s) => s.selesai).length}/3 langkah</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-green rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {!isInitialized ? (
            <Button onClick={handleMulaiPendaftaran} fullWidth className="py-3">
              Mulai Pendaftaran
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {status === 'Draft' && (
                <Button
                  onClick={() => navigate('/student/wizard?mode=awal')}
                  fullWidth
                  variant="primary"
                >
                  Lanjutkan Isi Formulir
                </Button>
              )}
              {status === 'Terdaftar' && (
                <Button
                  onClick={() => navigate('/student/kartu-pendaftaran')}
                  variant="primary"
                  fullWidth
                >
                  Lihat Kartu Pendaftaran
                </Button>
              )}
              {(status === 'Selesai' || status === 'Terverifikasi') && allComplete && (
                <p className="text-sm text-brand-green font-medium w-full text-center py-2">
                  Pendaftaran telah {status === 'Selesai' ? 'difinalisasi' : 'terverifikasi'}
                </p>
              )}
            </div>
          )}
        </Card>

        {isInitialized && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Pendaftaran Awal
            </h3>
            {steps.slice(0, 3).map((step, i) => {
              const Icon = stepIcons[i]
              return (
                <Card key={step.nomor} className={`p-4 ${step.selesai ? 'border-l-4 border-l-brand-green' : 'border-l-4 border-l-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${step.selesai ? 'bg-brand-green-light text-brand-green' : 'bg-slate-100 text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${step.selesai ? 'text-slate-800' : 'text-slate-500'}`}>
                          {stepLabels[i]}
                        </p>
                        {step.selesai && (
                          <p className="text-xs text-brand-green">Selesai</p>
                        )}
                      </div>
                    </div>
                    {!step.selesai && (
                      <Button onClick={() => navigate(`/student/wizard?mode=awal&step=${step.nomor}`)} variant="ghost" className="text-xs">
                        Isi
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}


          </div>
        )}

        {isInitialized && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Ringkasan Data
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <span className="text-slate-500">ID Pendaftaran:</span>
              <span className="text-slate-800 font-medium">{data.idPendaftaran}</span>
              <span className="text-slate-500">Jurusan Utama:</span>
              <span className="text-slate-800 font-medium">{data.pilihanJurusan || '-'}</span>
              <span className="text-slate-500">Gelombang:</span>
              <span className="text-slate-800 font-medium">{data.gelombang || '-'}</span>
              <span className="text-slate-500">Nama Lengkap:</span>
              <span className="text-slate-800 font-medium">{data.namaLengkap || '-'}</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
