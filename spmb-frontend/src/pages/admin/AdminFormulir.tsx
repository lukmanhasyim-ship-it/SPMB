import { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, FileText, ArrowLeft, Printer, CreditCard, Download } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ResponsiveTable from '../../components/ui/ResponsiveTable'
import Loader from '../../components/ui/Loader'
import Toast from '../../components/ui/Toast'
import { api } from '../../services/api'
import { renderFormJpeg, printJpeg, downloadJpeg } from '../../utils/formImage'
import { findLinkGroupWa } from '../../utils/waGroup'
import { a4SinglePrintCss, kartuPrintCss } from '../../utils/kartuPrint'
import { useKartuPrint } from '../../hooks/useKartuPrint'

import FormulirPendaftaran from './components/FormulirPendaftaran'
import KartuPendaftaranAdmin from './components/KartuPendaftaranAdmin'

interface SiswaRow {
  idPendaftaran: string
  email: string
  namaLengkap: string
  pilihanJurusan: string
  gelombang: string
  raw: Record<string, string>
}

const PAGE_SIZE = 10

export default function AdminFormulir() {
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Record<string, string> | null>(null)
  const [selectedKartu, setSelectedKartu] = useState<Record<string, string> | null>(null)
  const [linkGroupWa, setLinkGroupWa] = useState('')
  const { mode: printMode, print: handlePrintKartu } = useKartuPrint()
  const [page, setPage] = useState(1)
  const [searchParams] = useSearchParams()
  const autoSelected = useRef(false)
  const [busy, setBusy] = useState<'print' | 'download' | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.siswa.getAll()
        if (res.status === 'ok') {
          const list = (res.data as Array<Record<string, string>>).map((s) => ({
            idPendaftaran: s.id_pendaftaran || '',
            email: s.email || '',
            namaLengkap: s.nama_lengkap || '',
            pilihanJurusan: s.pilihan_jurusan || '-',
            gelombang: s.gelombang || '-',
            raw: s,
          }))
          setSiswaList(list)
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const id = searchParams.get('id')
    if (id && siswaList.length > 0 && !autoSelected.current) {
      autoSelected.current = true
      const found = siswaList.find((s) => s.idPendaftaran === id)
      if (found) setSelected(found.raw)
    }
  }, [searchParams, siswaList])

  useEffect(() => {
    const target = selectedKartu?.gelombang
    if (!selectedKartu || !target) {
      setLinkGroupWa('')
      return
    }
    let cancelled = false
    api.gelombang
      .get()
      .then((res) => {
        if (cancelled || res.status !== 'ok') return
        setLinkGroupWa(findLinkGroupWa(res.data as Array<Record<string, string>>, target))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [selectedKartu])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return siswaList.filter((s) => {
      const matchSearch =
        s.namaLengkap.toLowerCase().includes(q) ||
        s.idPendaftaran.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      return matchSearch
    })
  }, [siswaList, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  )
  const startIndex = (safePage - 1) * PAGE_SIZE

  useEffect(() => {
    setPage(1)
  }, [search])

  const pageList = useMemo(() => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }
    pages.push(1)
    if (safePage > 3) pages.push('...')
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
    if (safePage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }, [totalPages, safePage])

  const handleCetak = async () => {
    if (busy) return
    setBusy('print')
    try {
      const dataUrl = await renderFormJpeg()
      await printJpeg(dataUrl)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal mencetak formulir')
    } finally {
      setBusy(null)
    }
  }

  const handleDownloadJpg = async () => {
    if (busy) return
    setBusy('download')
    try {
      const dataUrl = await renderFormJpeg()
      const id = selected?.id_pendaftaran || 'formulir'
      await downloadJpeg(dataUrl, `Formulir-${id}.jpg`)
      showToast('success', 'Gambar formulir berhasil diunduh')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal mengunduh formulir')
    } finally {
      setBusy(null)
    }
  }

  if (selectedKartu) {
    return (
      <div className="page-fade-in space-y-4">
        {printMode && (
          <style>{printMode === 'kartu' ? kartuPrintCss() : a4SinglePrintCss()}</style>
        )}
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        <div className="kartu-screen-shell space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <button
              type="button"
              onClick={() => setSelectedKartu(null)}
              className="flex min-h-touch items-center gap-1.5 self-start rounded-xl px-2 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green-light hover:text-brand-green-dark"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>
            <h1 className="text-base font-bold text-slate-800 sm:text-lg">Bukti Pendaftaran</h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Button variant="primary" onClick={() => handlePrintKartu('kartu')} fullWidth className="sm:w-auto">
                <Printer className="h-4 w-4" />
                Cetak Kartu 65x95mm
              </Button>
              <Button variant="secondary" onClick={() => handlePrintKartu('a4')} fullWidth className="sm:w-auto">
                <FileText className="h-4 w-4" />
                Cetak A4
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <KartuPendaftaranAdmin id="area-cetak" data={selectedKartu} linkGroupWA={linkGroupWa} mode="screen" />
          </div>
          <p className="text-center text-[11px] text-slate-400">
            Ukuran kartu 65 x 95 mm. Untuk cetak massal sekaligus, gunakan menu
            &quot;Cetak Kartu&quot; di sidebar.
          </p>
        </div>
        {printMode && (
          <div className="kartu-print-root">
            <div className="a4-sheet">
              <KartuPendaftaranAdmin data={selectedKartu} linkGroupWA={linkGroupWa} />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (selected) {
    return (
      <div className="page-fade-in space-y-4">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="flex min-h-touch items-center gap-1.5 self-start rounded-xl px-2 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green-light hover:text-brand-green-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <h1 className="text-base font-bold text-slate-800 sm:text-lg">Formulir Pendaftaran</h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Button
              variant="primary"
              onClick={handleDownloadJpg}
              loading={busy === 'download'}
              disabled={busy !== null}
              className="flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Download JPG
            </Button>
            <Button
              variant="secondary"
              onClick={handleCetak}
              loading={busy === 'print'}
              disabled={busy !== null}
              className="flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Cetak
            </Button>
          </div>
        </div>
        <FormulirPendaftaran data={selected} />
      </div>
    )
  }

  return (
    <div className="page-fade-in space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Generate Formulir Pendaftaran</h1>
        <p className="text-sm text-slate-500">
          Pilih calon siswa untuk membuat formulir pendaftaran terisi data
        </p>
      </div>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, ID, atau email..."
          aria-label="Cari siswa berdasarkan nama, ID, atau email"
          className="min-h-touch w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green sm:text-sm"
        />
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div>
          <ResponsiveTable
            caption="Daftar calon siswa untuk generate formulir pendaftaran"
            emptyMessage="Tidak ada data yang cocok"
            minWidth={880}
            data={paginated}
            getRowId={(siswa) => siswa.idPendaftaran}
            columns={[
              {
                key: 'no',
                header: 'No',
                render: (_, i) => <span className="text-slate-500">{startIndex + i + 1}</span>,
              },
              {
                key: 'id',
                header: 'ID',
                render: (siswa) => (
                  <span className="font-mono text-xs text-slate-700">{siswa.idPendaftaran}</span>
                ),
              },
              {
                key: 'nama',
                header: 'Nama',
                render: (siswa) => (
                  <div>
                    <p className="font-medium text-slate-800">{siswa.namaLengkap}</p>
                    <p className="text-xs text-slate-400">{siswa.email}</p>
                  </div>
                ),
              },
              {
                key: 'jurusan',
                header: 'Program Keahlian',
                render: (siswa) => siswa.pilihanJurusan,
              },
              {
                key: 'gelombang',
                header: 'Gelombang',
                render: (siswa) => siswa.gelombang,
              },
              {
                key: 'aksi',
                header: 'Aksi',
                headerClassName: 'text-right',
                cellClassName: 'text-right',
                render: (siswa) => (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      className="text-xs px-3 py-2 whitespace-nowrap"
                      onClick={() => setSelectedKartu(siswa.raw)}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Bukti Pendaftaran
                    </Button>
                    <Button
                      variant="secondary"
                      className="text-xs px-3 py-2 whitespace-nowrap"
                      onClick={() => setSelected(siswa.raw)}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Generate Formulir
                    </Button>
                  </div>
                ),
              },
            ]}
            mobileCard={(siswa, index) => (
              <Card className="p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">
                    {startIndex + index + 1}. {siswa.namaLengkap}
                  </p>
                  <p className="truncate font-mono text-[11px] text-slate-400">
                    {siswa.idPendaftaran}
                  </p>
                </div>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Program Keahlian</dt>
                    <dd className="min-w-0 truncate text-right font-medium text-slate-700">
                      {siswa.pilihanJurusan}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Gelombang</dt>
                    <dd className="font-medium text-slate-700">{siswa.gelombang}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                  <Button
                    variant="ghost"
                    fullWidth
                    className="text-xs"
                    onClick={() => setSelectedKartu(siswa.raw)}
                  >
                    <CreditCard className="h-4 w-4" />
                    Bukti Pendaftaran
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    className="text-xs"
                    onClick={() => setSelected(siswa.raw)}
                  >
                    <FileText className="h-4 w-4" />
                    Generate Formulir
                  </Button>
                </div>
              </Card>
            )}
          />

          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <p className="text-xs text-slate-500">
                Menampilkan {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)} dari {filtered.length} data
              </p>
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    aria-label="Halaman sebelumnya"
                    className="min-h-touch min-w-touch rounded-lg px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>
                  {pageList.map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-xs">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        aria-label={`Halaman ${p}`}
                        aria-current={p === safePage ? 'page' : undefined}
                        className={`min-h-touch min-w-touch rounded-lg text-xs font-medium transition-colors ${
                          p === safePage
                            ? 'bg-brand-green text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    aria-label="Halaman berikutnya"
                    className="min-h-touch min-w-touch rounded-lg px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
