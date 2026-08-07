import { QRCodeSVG } from 'qrcode.react'
import { DATA_JURUSAN } from '../../../data/constants'
import { formatWIB } from '../../../utils/dateUtils'

interface KartuPendaftaranAdminProps {
  data: Record<string, string>
}

export default function KartuPendaftaranAdmin({ data }: KartuPendaftaranAdminProps) {
  const jurusanLabel = DATA_JURUSAN.find((j) => j.value === data.pilihan_jurusan)?.label || data.pilihan_jurusan
  const jurusanAltLabel = DATA_JURUSAN.find((j) => j.value === data.pilihan_alternatif)?.label || ''
  const qrData = data.id_pendaftaran || '-'

  return (
    <div
      id="area-cetak"
      className="max-w-md mx-auto bg-slate-800 text-white rounded-2xl overflow-hidden shadow-xl print:shadow-none"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10 brightness-0 invert" />
            <div>
              <p className="text-[10px] text-brand-green-light uppercase tracking-widest font-medium">
                SMKS AL AZHAR SEMPU
              </p>
              <p className="text-sm font-bold mt-0.5">Bukti Pendaftaran Resmi</p>
            </div>
          </div>
          <QRCodeSVG value={qrData} size={40} bgColor="transparent" fgColor="#ffffff" />
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shrink-0 bg-slate-700 flex items-center justify-center">
            {data.foto_profil_url ? (
              <img src={data.foto_profil_url} alt="Foto" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-slate-400">
                {data.nama_lengkap?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div>
            <p className="text-base font-bold">{data.nama_lengkap || '-'}</p>
            <p className="text-xs text-slate-400">{data.email || 'Tanpa Email'}</p>
            <p className="text-xs text-brand-green-light mt-0.5 font-medium">
              {data.id_pendaftaran}
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
            <span className="font-medium">{data.tahun_ajaran || '-'}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-1.5">
            <span className="text-slate-400">Waktu Daftar</span>
            <span className="font-medium">
              {formatWIB(data.waktu_daftar)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status</span>
            <span className="font-medium text-brand-green-light">{data.status_pendaftaran || '-'}</span>
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
    </div>
  )
}
