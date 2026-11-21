import BuktiPendaftaranCard, { KartuData } from '../../../components/kartu/BuktiPendaftaranCard'
import { DATA_JURUSAN } from '../../../data/constants'
import { formatWIB } from '../../../utils/dateUtils'

interface KartuPendaftaranAdminProps {
  data: Record<string, string>
  linkGroupWA?: string
  /** Hanya diisi pada tampilan layar; area cetak memakai .kartu-print-root. */
  id?: string
  mode?: 'screen' | 'print'
}

export default function KartuPendaftaranAdmin({ data, linkGroupWA = '', id, mode }: KartuPendaftaranAdminProps) {
  const jurusanLabel = DATA_JURUSAN.find((j) => j.value === data.pilihan_jurusan)?.label || data.pilihan_jurusan

  const kartuData: KartuData = {
    nama: data.nama_lengkap || '-',
    email: data.email || 'Tanpa Email',
    idPendaftaran: data.id_pendaftaran || '-',
    jurusanLabel,
    gelombang: data.gelombang || '-',
    tahunAjaran: data.tahun_ajaran || '-',
    waktuDaftar: formatWIB(data.waktu_daftar),
    status: data.status_pendaftaran || '-',
    fotoUrl: data.foto_profil_url,
    initials: data.nama_lengkap || '?',
    linkGroupWA,
  }

  return <BuktiPendaftaranCard id={id} data={kartuData} mode={mode} />
}