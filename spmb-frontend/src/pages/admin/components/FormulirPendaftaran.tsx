import type { ReactNode } from 'react'
import { formatWIBShort } from '../../../utils/dateUtils'
import { DATA_JURUSAN } from '../../../data/constants'

interface FormulirPendaftaranProps {
  data: Record<string, string>
}

function jurusanLabel(value: string): string {
  if (!value) return ''
  const jurusan = DATA_JURUSAN.find((j) => j.value === value)
  return jurusan ? jurusan.label : value
}

function FieldItem({ label, value, span2 = false }: { label: string; value?: string; span2?: boolean }) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">{label}</span>
      <div className="border-b-2 border-slate-800 text-[13px] font-semibold text-slate-900 py-1 min-h-[28px] leading-6">
        {value || ''}
      </div>
    </div>
  )
}

function BoxField({ label, value, minHeight = '64px' }: { label: string; value?: string; minHeight?: string }) {
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">{label}</span>
      <div
        className="border-2 border-slate-800 text-[13px] font-semibold text-slate-900 px-2 py-1 leading-6"
        style={{ minHeight }}
      >
        {value || ''}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-1 mb-3">
      {children}
    </h3>
  )
}

export default function FormulirPendaftaran({ data }: FormulirPendaftaranProps) {
  const tglLahir = data.tanggal_lahir ? formatWIBShort(data.tanggal_lahir) : ''

  return (
    <div
      id="area-cetak"
      className="bg-white border border-slate-200 shadow-xl print:shadow-none print:border-0 rounded-lg print:rounded-none max-w-4xl mx-auto"
    >
      <div className="border-b-4 border-slate-800">
        <img src="/kop.png" alt="Kop Surat" className="w-full" />
      </div>

      <div className="px-6 pt-4 flex items-start justify-between gap-6">
        <div className="flex-1 text-center">
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-900">
            Formulir Pendaftaran
          </h1>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-700 mt-0.5">
            Peserta Didik Baru Tahun Ajaran {data.tahun_ajaran || '-'}
          </p>
          <div className="flex items-center justify-center gap-6 mt-2 text-[11px] text-slate-600">
            <p>
              No. Pendaftaran:{' '}
              <span className="font-bold text-slate-900">{data.id_pendaftaran || '-'}</span>
            </p>
            <p>
              Gelombang: <span className="font-bold text-slate-900">{data.gelombang || '-'}</span>
            </p>
          </div>
        </div>
        <div className="w-24 h-32 shrink-0 border-2 border-slate-800 flex items-center justify-center bg-white">
          {data.foto_profil_url ? (
            <img src={data.foto_profil_url} alt="Pas Foto" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[9px] text-slate-400 text-center px-1 leading-tight">
              Pas Foto
              <br />
              3x4
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="border border-slate-400 divide-y divide-slate-300">
          <section className="p-4">
            <SectionTitle>A. Pilihan Jurusan</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <FieldItem label="Jurusan Utama" value={jurusanLabel(data.pilihan_jurusan)} span2 />
              <FieldItem label="Jurusan Alternatif" value={jurusanLabel(data.pilihan_alternatif)} />
              <FieldItem label="Asal Sekolah" value={data.asal_sekolah} />
              <BoxField label="Alasan Memilih Jurusan" value={data.alasan_pilih_jurusan} />
            </div>
          </section>

          <section className="p-4">
            <SectionTitle>B. Data Pribadi</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <FieldItem label="Nama Lengkap (Sesuai Ijazah/Akte)" value={data.nama_lengkap} span2 />
              <FieldItem label="Jenis Kelamin" value={data.jenis_kelamin} />
              <FieldItem label="NISN" value={data.nisn} />
              <FieldItem label="NIK" value={data.nik} />
              <FieldItem label="Tempat Lahir" value={data.tempat_lahir} />
              <FieldItem label="Tanggal Lahir" value={tglLahir} />
              <FieldItem label="Agama" value={data.agama} />
            </div>
          </section>

          <section className="p-4">
            <SectionTitle>C. Alamat Tempat Tinggal</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <FieldItem label="Alamat (Dusun / Jalan)" value={data.dusun} />
              <FieldItem label="RT / RW" value={data.rt_rw} />
              <FieldItem label="Desa / Kelurahan" value={data.desa} />
              <FieldItem label="Kecamatan" value={data.kecamatan} />
              <FieldItem label="Kabupaten / Kota" value={data.kabupaten} />
              <FieldItem label="Kode Pos" value={data.kode_pos} />
              <FieldItem label="Tinggal Bersama" value={data.tinggal_bersama} />
            </div>
          </section>

          <section className="p-4">
            <SectionTitle>D. Data Orang Tua / Wali</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <FieldItem label="Nama Ayah" value={data.nama_ayah} />
              <FieldItem label="Pekerjaan Ayah" value={data.kerja_ayah} />
              <FieldItem label="Nama Ibu" value={data.nama_ibu} />
              <FieldItem label="Pekerjaan Ibu" value={data.kerja_ibu} />
              <FieldItem label="No. Telepon Orang Tua / Wali" value={data.telepon_ortu} span2 />
            </div>
          </section>

          <section className="p-4">
            <SectionTitle>E. Prestasi (Opsional)</SectionTitle>
            <BoxField label="Prestasi yang Pernah Diraih" value={data.prestasi} minHeight="56px" />
          </section>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mt-8 text-[11px] text-slate-700">
          <div>
            <p>
              Sempu, {formatWIBShort(new Date().toISOString())}
            </p>
            <p className="mt-0.5">Orang Tua / Wali Calon Peserta Didik</p>
            <div className="h-16" />
            <p className="font-semibold text-slate-900">
              {data.nama_ayah || data.nama_ibu ? `( ${data.nama_ayah || data.nama_ibu} )` : '( ______________ )'}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="mt-7">Calon Peserta Didik</p>
            <div className="h-14" />
            <p className="font-semibold text-slate-900">
              {data.nama_lengkap ? `( ${data.nama_lengkap} )` : '( ______________ )'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
