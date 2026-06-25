import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useStudentStore } from '../../store/studentStore'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { DATA_JURUSAN } from '../../data/constants'
import { formatWIB } from '../../utils/dateUtils'

export default function KartuPendaftaran() {
  const navigate = useNavigate()
  const { data } = useStudentStore()
  const { user } = useAuthStore()

  const jurusanLabel = DATA_JURUSAN.find((j) => j.value === data.pilihanJurusan)?.label || data.pilihanJurusan
  const jurusanAltLabel = DATA_JURUSAN.find((j) => j.value === data.pilihanAlternatif)?.label || ''

  const qrData = JSON.stringify({
    id: data.idPendaftaran,
    nama: data.namaLengkap,
    jurusan: data.pilihanJurusan,
    email: data.email,
  })

  const handleDownload = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="flex items-center gap-1.5 text-sm text-brand-green hover:text-brand-green-dark font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <h2 className="text-lg font-bold text-slate-800">Kartu Pendaftaran</h2>
          <div className="w-20" />
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="bg-slate-800 p-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="Logo" className="w-10 h-10 brightness-0 invert" />
                <div>
                  <p className="text-[10px] text-brand-green-light uppercase tracking-widest font-medium">
                    SMKS AL AZHAR SEMPU
                  </p>
                  <p className="text-sm font-bold mt-0.5">Kartu Pendaftaran</p>
                </div>
              </div>
              <QRCodeSVG value={qrData} size={40} bgColor="transparent" fgColor="#ffffff" />
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shrink-0 bg-slate-700 flex items-center justify-center">
                {user?.fotoUrl ? (
                  <img src={user.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-slate-400">
                    {data.namaLengkap?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div>
                <p className="text-base font-bold">{data.namaLengkap || '-'}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <p className="text-xs text-brand-green-light mt-0.5 font-medium">
                  {data.idPendaftaran}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Jurusan Utama</span>
                <span className="font-medium text-right">{jurusanLabel || '-'}</span>
              </div>
              {jurusanAltLabel && (
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-400">Jurusan Alternatif</span>
                  <span className="font-medium text-right">{jurusanAltLabel}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Gelombang</span>
                <span className="font-medium">{data.gelombang || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Tahun Ajaran</span>
                <span className="font-medium">{data.tahunAjaran || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Waktu Daftar</span>
                <span className="font-medium">
                  {formatWIB(data.waktuDaftar)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="font-medium text-brand-green-light">Terdaftar</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={qrData} size={120} />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Scan untuk verifikasi data pendaftaran
              </p>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleDownload} fullWidth variant="primary">
            <Download className="w-4 h-4" />
            Download Kartu
          </Button>
          <Link
            to="/student/wizard?mode=final"
            className="flex-1"
          >
            <Button fullWidth variant="secondary">
              Lanjutkan Finalisasi Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
