import { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, FileText, ArrowLeft, Printer, CreditCard } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { api } from '../../services/api'
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
  const [page, setPage] = useState(1)
  const [searchParams] = useSearchParams()
  const autoSelected = useRef(false)

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

  const handlePrint = () => {
    window.print()
  }

  if (selectedKartu) {
    return (
      <div className="page-fade-in space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <button
            onClick={() => setSelectedKartu(null)}
            className="flex items-center gap-1.5 text-sm text-brand-green hover:text-brand-green-dark font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <h1 className="text-lg font-bold text-slate-800">Bukti Pendaftaran</h1>
          <Button variant="primary" onClick={handlePrint} className="flex items-center gap-1.5">
            <Printer className="w-4 h-4" />
            Cetak / Download Bukti
          </Button>
        </div>
        <KartuPendaftaranAdmin data={selectedKartu} />
      </div>
    )
  }

  if (selected) {
    return (
      <div className="page-fade-in space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-sm text-brand-green hover:text-brand-green-dark font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <h1 className="text-lg font-bold text-slate-800">Formulir Pendaftaran</h1>
          <Button variant="primary" onClick={handlePrint} className="flex items-center gap-1.5">
            <Printer className="w-4 h-4" />
            Cetak / Download PDF
          </Button>
        </div>
        <FormulirPendaftaran data={selected} />
      </div>
    )
  }

  return (
    <div className="page-fade-in space-y-6">
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
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
        />
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto">
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">No</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Jurusan</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Gelombang</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada data yang cocok
                    </td>
                  </tr>
                ) : (
                  paginated.map((siswa, index) => (
                    <tr key={siswa.idPendaftaran} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500">{startIndex + index + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{siswa.idPendaftaran}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{siswa.namaLengkap}</p>
                        <p className="text-xs text-slate-400">{siswa.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{siswa.pilihanJurusan}</td>
                      <td className="px-4 py-3 text-slate-700">{siswa.gelombang}</td>
                      <td className="px-4 py-3 text-right">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <p className="text-xs text-slate-500">
                Menampilkan {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)} dari {filtered.length} data
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
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
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
