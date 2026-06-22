import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, MessageCircle, FileText, UserCheck, MapPin, Award } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useStudentStore } from '../../store/studentStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { api } from '../../services/api'

const statusStyle: Record<string, string> = {
  Draft: 'bg-amber-50 text-amber-700',
  Terdaftar: 'bg-blue-50 text-blue-700',
  Selesai: 'bg-brand-green-light text-brand-green-dark',
  Terverifikasi: 'bg-brand-green-light text-brand-green-dark',
}

export default function DashboardSiswa() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { data, steps, loadSiswa, getProgressPercent, loading } = useStudentStore()
  const [gelombangAktif, setGelombangAktif] = useState<{ gelombang: string; tanggalMulai: string; tanggalSelesai: string; linkGroupWA: string } | null>(null)

  useEffect(() => {
    if (user?.email) {
      loadSiswa(user.email)
      api.gelombang.get().then((res) => {
        if (res.status === 'ok') {
          const list = res.data as Array<Record<string, string>>
          const aktif = list.find((g) => g.status === 'Aktif')
          if (aktif) {
            setGelombangAktif({
              gelombang: aktif.gelombang,
              tanggalMulai: aktif.tanggal_mulai,
              tanggalSelesai: aktif.tanggal_selesai,
              linkGroupWA: aktif.link_group_wa,
            })
          }
        }
      }).catch(() => {})
    }
  }, [user?.email])

  const isInitialized = data.idPendaftaran !== ''
  const progressPercent = getProgressPercent()
  const allComplete = steps.every((s) => s.selesai)
  const status = data.statusPendaftaran

  const langkah123Selesai = steps[0].selesai && steps[1].selesai && steps[2].selesai

  const handleMulaiPendaftaran = () => {
    navigate('/student/wizard?mode=awal')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const stepIcons = [FileText, UserCheck, MapPin, User, Award]
  const stepLabels = ['Jurusan', 'Data Pribadi', 'Alamat & Peta', 'Orang Tua/Wali', 'Berkas & Prestasi']

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
                {loading ? 'Memuat data...' : !isInitialized
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
                <span>{steps.filter((s) => s.selesai).length}/5 langkah</span>
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
                <>
                  <Button
                    onClick={() => navigate('/student/kartu-pendaftaran')}
                    variant="secondary"
                  >
                    Kartu Pendaftaran
                  </Button>
                  <Button
                    onClick={() => navigate('/student/wizard?mode=final')}
                    fullWidth
                    variant="primary"
                  >
                    Finalisasi Profile
                  </Button>
                </>
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

            {status === 'Terdaftar' || status === 'Selesai' || status === 'Terverifikasi' ? (
              <>
                <h3 className="text-sm font-semibold text-slate-700 pt-2">
                  Finalisasi Profile
                </h3>
                {steps.slice(3, 5).map((step, i) => {
                  const Icon = stepIcons[i + 3]
                  const isLocked = status === 'Terdaftar'
                  return (
                    <Card key={step.nomor} className={`p-4 ${step.selesai ? 'border-l-4 border-l-brand-green' : isLocked ? 'border-l-4 border-l-brand-orange/50' : 'border-l-4 border-l-slate-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${step.selesai ? 'bg-brand-green-light text-brand-green' : isLocked ? 'bg-amber-50 text-brand-orange' : 'bg-slate-100 text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${step.selesai ? 'text-slate-800' : 'text-slate-500'}`}>
                              {stepLabels[i + 3]}
                            </p>
                            {step.selesai ? (
                              <p className="text-xs text-brand-green">Selesai</p>
                            ) : status === 'Terdaftar' ? (
                              <p className="text-xs text-amber-600">Belum diisi</p>
                            ) : null}
                          </div>
                        </div>
                        {!step.selesai && status === 'Terdaftar' && (
                          <Button onClick={() => navigate(`/student/wizard?mode=final&step=${step.nomor}`)} variant="ghost" className="text-xs">
                            Isi
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </>
            ) : null}
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
