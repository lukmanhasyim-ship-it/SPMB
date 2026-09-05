import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
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

const sheetStyle: React.CSSProperties = {
  width: '210mm',
  height: '330mm',
  boxSizing: 'border-box',
  padding: 0,
  margin: 0,
  backgroundColor: 'transparent',
  border: 'none',
}

const previewShellStyle: React.CSSProperties = {
  width: '210mm',
  boxShadow: 'none',
  backgroundColor: 'transparent',
}

const printCss = `
  @page {
    size: 210mm 330mm;
    margin: 3mm 3mm 3mm 30mm;
  }

  .screen-form-shell {
    display: block;
  }

  .print-form-template {
    display: none;
  }

  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .screen-form-shell {
      display: none !important;
    }

    .print-form-template {
      display: block !important;
    }

    #area-cetak,
    #area-cetak-print {
      width: 210mm !important;
      height: 330mm !important;
      max-width: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      background: transparent !important;
      border: none !important;
    }

    .form-page {
      width: 177mm !important;
      max-width: 177mm !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      background-size: 210mm 330mm !important;
      background-position: -30mm -3mm !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`

const formPageStyle: React.CSSProperties = {
  width: '177mm',
  height: '324mm',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
  backgroundImage: "url('/bg-formulir.png')",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '-30mm -3mm',
  backgroundSize: '210mm 330mm',
}

const FIT_TARGET_PX = 1200

function FormBody({ data }: { data: Record<string, string> }) {
  const tglLahir = data.tanggal_lahir ? formatWIBShort(data.tanggal_lahir) : '-'
  const today = formatWIBShort(new Date().toISOString())

  return (
    <div className="form-content">
      <PageHeader />

      <div className="px-7 pb-3 pt-1 text-center">
        <h1 className="text-[18px] font-black uppercase tracking-[0.12em] text-[#0f172a]">FORMULIR PENDAFTARAN</h1>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
          Peserta Didik Baru Tahun Ajaran {safeValue(data.tahun_ajaran)}
        </p>
        <p className="mt-0.5 text-[10px] font-medium text-slate-700">
          ID Pendaftaran: <span className="font-bold text-slate-900">{safeValue(data.id_pendaftaran)}</span>{' '}
          | Gelombang: <span className="font-bold text-slate-900">{safeValue(data.gelombang)}</span>
        </p>
      </div>

      <div className="px-7 pb-4">
        <div className="w-full leading-[1.35]">
          <div className="space-y-2">
            <section>
              <SectionTitle>A. Pilihan Jurusan</SectionTitle>
              <div className="grid grid-cols-[1fr_150px] items-start gap-x-5 gap-y-1.5">
                <div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    <div className="col-span-2">
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
                    <div className="col-span-2">
                      <FieldLabel>Alasan Memilih Jurusan Alternatif</FieldLabel>
                      <FieldValue className="min-h-[26px]">{safeValue(data.alasan_pilih_jurusan)}</FieldValue>
                    </div>
                  </div>
                </div>

                <div className="mt-0 flex items-start justify-center self-start pt-1">
                  <div className="flex h-[140px] w-[105px] items-center justify-center border-[2px] border-[#9bb9a7] bg-[#f8faf9] text-center shadow-inner overflow-hidden">
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
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="col-span-2">
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
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
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
                <div className="col-span-2">
                  <FieldLabel>Tinggal Bersama</FieldLabel>
                  <FieldValue>{safeValue(data.tinggal_bersama)}</FieldValue>
                </div>
              </div>
            </section>

            <section>
              <SectionTitle>D. Orang Tua / Wali</SectionTitle>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
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
                <div className="col-span-2">
                  <FieldLabel>No. Telepon Orang Tua / Wali</FieldLabel>
                  <FieldValue>{safeValue(data.telepon_ortu)}</FieldValue>
                </div>
                <div className="col-span-2">
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
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
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
  )
}

export default function FormulirPendaftaran({ data }: FormulirPendaftaranProps) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return

    const measure = () => {
      const natural = content.offsetHeight
      if (natural > 0) setScale(Math.min(1, FIT_TARGET_PX / natural))
    }

    measure()
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (resizeObserver) resizeObserver.observe(content)

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts?.ready?.then) fonts.ready.then(measure)

    window.addEventListener('load', measure)

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      window.removeEventListener('load', measure)
    }
  }, [data])

  const contentStyle: React.CSSProperties = {
    transform: scale < 1 ? `scale(${scale})` : undefined,
    transformOrigin: 'top left',
  }

  return (
    <>
      <style>{printCss}</style>

      <div className="screen-form-shell mx-auto w-fit p-3">
        <div style={previewShellStyle}>
          <div id="area-cetak" style={sheetStyle}>
            <div className="form-page relative" style={formPageStyle}>
              <div ref={contentRef} style={contentStyle}>
                <FormBody data={data} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="print-form-template mx-auto w-fit" aria-hidden="true">
        <div id="area-cetak-print" style={sheetStyle}>
          <div className="form-page relative" style={formPageStyle}>
            <div style={contentStyle}>
              <FormBody data={data} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}