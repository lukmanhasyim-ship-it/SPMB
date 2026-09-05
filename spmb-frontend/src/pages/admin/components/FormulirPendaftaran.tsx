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

function safeValue(value?: string): string {
  return value && value.trim() ? value : '-'
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="block text-[9px] font-black uppercase tracking-[0.12em] leading-[1.25] text-[#1a6f53]">{children}</span>
}

function FieldValue({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`min-h-[18px] border-b border-dashed border-[#94c7b2] pb-0.5 text-[11px] font-semibold leading-[1.3] text-slate-900 ${className}`}>{children}</div>
}

function PageHeader() {
  return (
    <div className="w-full border-b-[3px] border-[#1e7d57] bg-white/60 pb-1.5 mx-0 px-0">
      <div className="w-full px-0 pt-0">
        <img src="/kop.png" alt="Kop surat" className="block h-auto w-full max-w-none object-contain m-0 p-0" />
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-1.5 mt-2 inline-block rounded-[3px] bg-[#1b8d66] px-2 py-0.5 text-[10px] font-black uppercase leading-[1.2] tracking-[0.15em] text-white">
      {children}
    </h3>
  )
}

const pageStyle: React.CSSProperties = {
  width: '210mm',
  height: '330mm',
  backgroundImage: "url('/bg-formulir.png')",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center bottom',
  backgroundSize: '210mm 330mm',
  backgroundAttachment: 'scroll',
  pageBreakInside: 'avoid',
  breakInside: 'avoid',
  margin: 0,
  padding: 0,
  boxSizing: 'border-box',
}

const printCss = `
  @page {
    size: 210mm 330mm;
    margin: 3mm 3mm 3mm 30mm;
  }

  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #f5f5f2 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    #area-cetak {
      width: 210mm !important;
      max-width: 210mm !important;
      min-height: 330mm !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .form-page {
      width: 210mm !important;
      min-height: 330mm !important;
      max-width: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box;
      background-size: 210mm 330mm !important;
      background-position: center bottom !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background-color: transparent !important;
    }
  }
`

export default function FormulirPendaftaran({ data }: FormulirPendaftaranProps) {
  const tglLahir = data.tanggal_lahir ? formatWIBShort(data.tanggal_lahir) : '-'
  const today = formatWIBShort(new Date().toISOString())

  return (
    <>
      <style>{printCss}</style>
      <div id="area-cetak" className="mx-auto w-[210mm] max-w-[210mm] px-0 py-0 print:p-0 print:max-w-none">
        <div className="relative overflow-visible print:rounded-none">
          <div className="form-page relative" style={pageStyle}>
            <PageHeader />

            <div className="px-7 pb-3 pt-1 text-center print:px-5">
              <h1 className="text-[18px] font-black uppercase tracking-[0.12em] text-[#0f172a]">FORMULIR PENDAFTARAN</h1>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                Peserta Didik Baru Tahun Ajaran {safeValue(data.tahun_ajaran)}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-700">
                ID Pendaftaran: <span className="font-bold text-slate-900">{safeValue(data.id_pendaftaran)}</span>{' '}
                | Gelombang: <span className="font-bold text-slate-900">{safeValue(data.gelombang)}</span>
              </p>
            </div>

            <div className="px-7 pb-4 print:px-5">
              <div className="w-full leading-[1.35]">
                <div className="space-y-2">
                  <section>
                    <SectionTitle>A. Pilihan Jurusan</SectionTitle>
                    <div className="grid grid-cols-1 gap-x-5 gap-y-1.5 md:grid-cols-[1fr_150px] md:items-start">
                      <div>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <FieldLabel>Program Keahlian Utama</FieldLabel>
                            <FieldValue>{safeValue(jurusanLabel(data.pilihan_jurusan))}</FieldValue>
                          </div>
                          <div>
                            <FieldLabel>Program Keahlian Alternatif</FieldLabel>
                            <FieldValue>{safeValue(jurusanLabel(data.pilihan_alternatif))}</FieldValue>
                          </div>
                          <div>
                            <FieldLabel>Asal Sekolah</FieldLabel>
                            <FieldValue>{safeValue(data.asal_sekolah)}</FieldValue>
                          </div>
                          <div className="md:col-span-2">
                            <FieldLabel>Alasan Memilih Jurusan Alternatif</FieldLabel>
                            <FieldValue className="min-h-[26px]">{safeValue(data.alasan_pilih_jurusan)}</FieldValue>
                          </div>
                        </div>
                      </div>

                      <div className="mt-0 flex items-start justify-center self-start pt-1 md:pt-4">
                        <div className="flex h-[140px] w-[105px] items-center justify-center border-[2px] border-[#9bb9a7] bg-[#f8faf9] text-center shadow-inner overflow-hidden print:h-[140px] print:w-[105px]">
                          {data.foto_profil_url ? (
                            <img src={data.foto_profil_url} alt="Pas foto" className="h-full w-full object-cover" />
                          ) : (
                            <div className="text-[11px] font-bold uppercase leading-5 tracking-[0.12em] text-slate-400">
                              FOTO
                              <br />
                              3x4
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <SectionTitle>B. Data Siswa</SectionTitle>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <FieldLabel>Nama Lengkap (Sesuai Ijazah/Akte)</FieldLabel>
                        <FieldValue>{safeValue(data.nama_lengkap)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Jenis Kelamin</FieldLabel>
                        <FieldValue>{safeValue(data.jenis_kelamin)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>NISN</FieldLabel>
                        <FieldValue>{safeValue(data.nisn)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>NIK</FieldLabel>
                        <FieldValue>{safeValue(data.nik)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Agama</FieldLabel>
                        <FieldValue>{safeValue(data.agama)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>No. HP Siswa (WhatsApp)</FieldLabel>
                        <FieldValue>{safeValue(data.telepon_siswa)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Tempat Lahir</FieldLabel>
                        <FieldValue>{safeValue(data.tempat_lahir)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Tanggal Lahir</FieldLabel>
                        <FieldValue>{tglLahir}</FieldValue>
                      </div>
                    </div>
                  </section>

                  <section>
                    <SectionTitle>C. Alamat Tempat Tinggal</SectionTitle>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 md:grid-cols-2">
                      <div>
                        <FieldLabel>Alamat (Dusun / Jalan)</FieldLabel>
                        <FieldValue>{safeValue(data.dusun)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>RT / RW</FieldLabel>
                        <FieldValue>{safeValue(data.rt_rw)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Desa / Kelurahan</FieldLabel>
                        <FieldValue>{safeValue(data.desa)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Kecamatan</FieldLabel>
                        <FieldValue>{safeValue(data.kecamatan)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Kabupaten / Kota</FieldLabel>
                        <FieldValue>{safeValue(data.kabupaten)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Kode Pos</FieldLabel>
                        <FieldValue>{safeValue(data.kode_pos)}</FieldValue>
                      </div>
                      <div className="md:col-span-2">
                        <FieldLabel>Tinggal Bersama</FieldLabel>
                        <FieldValue>{safeValue(data.tinggal_bersama)}</FieldValue>
                      </div>
                    </div>
                  </section>

                  <section>
                    <SectionTitle>D. Orang Tua / Wali</SectionTitle>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 md:grid-cols-2">
                      <div>
                        <FieldLabel>Nama Ayah</FieldLabel>
                        <FieldValue>{safeValue(data.nama_ayah)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Pekerjaan Ayah</FieldLabel>
                        <FieldValue>{safeValue(data.kerja_ayah)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Nama Ibu</FieldLabel>
                        <FieldValue>{safeValue(data.nama_ibu)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Pekerjaan Ibu</FieldLabel>
                        <FieldValue>{safeValue(data.kerja_ibu)}</FieldValue>
                      </div>
                      <div className="md:col-span-2">
                        <FieldLabel>No. Telepon Orang Tua / Wali</FieldLabel>
                        <FieldValue>{safeValue(data.telepon_ortu)}</FieldValue>
                      </div>
                      <div className="md:col-span-2">
                        <FieldLabel>Estimasi Penghasilan Orang Tua / Wali</FieldLabel>
                        <FieldValue>{safeValue(data.estimasi_penghasilan_ortu)}</FieldValue>
                      </div>
                    </div>
                  </section>

                  <section>
                    <SectionTitle>E. Prestasi</SectionTitle>
                    <div className="w-full rounded-[4px] border border-[#9bb9a7] bg-[#f8faf9] px-3 py-1.5 text-[11px] font-semibold text-slate-900">
                      {safeValue(data.prestasi)}
                    </div>
                  </section>

                  <section>
                    <SectionTitle>F. Referral</SectionTitle>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 md:grid-cols-2">
                      <div>
                        <FieldLabel>Kategori Referral</FieldLabel>
                        <FieldValue>{safeValue(data.referral_kategori)}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Nama Referral</FieldLabel>
                        <FieldValue>{safeValue(data.referral_nama)}</FieldValue>
                      </div>
                    </div>
                  </section>

                  <div className="mt-4 grid grid-cols-2 gap-5 text-[10px] font-medium text-slate-700">
                    <div>
                      <p>Sempu, {today}</p>
                      <p className="mt-3">Orang Tua / Wali Calon Peserta Didik</p>
                    </div>
                    <div className="text-right">
                      <p className="mt-5">Calon Peserta Didik</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 text-[10px] font-semibold text-slate-900">
                    <div className="h-10 border-b border-slate-900/80" />
                    <div className="h-10 border-b border-slate-900/80 ml-auto w-[80%]" />
                  </div>

                  <div className="mt-1 grid grid-cols-2 gap-5 text-[10px] font-bold text-slate-900">
                    <div className="text-left">({safeValue(data.nama_ayah || data.nama_ibu)})</div>
                    <div className="text-right">({safeValue(data.nama_lengkap)})</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}