import { useCallback, useEffect, useMemo, useState } from 'react'
import { Printer, Search, Users, Files } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import BuktiPendaftaranCard, { KartuData } from '../../components/kartu/BuktiPendaftaranCard'
import { DATA_JURUSAN } from '../../data/constants'
import { formatWIB } from '../../utils/dateUtils'
import { api } from '../../services/api'
import { useKartuPrint } from '../../hooks/useKartuPrint'
import {
  A4_GRID_COLS,
  A4_GRID_ROWS,
  A4_MAX_CARDS,
  A4_W_MM,
  A4_H_MM,
  a4PrintCss,
  a4SheetCss,
  chunkIntoSheets,
} from '../../utils/kartuPrint'

interface SiswaRow {
  idPendaftaran: string
  namaLengkap: string
  email: string
  gelombang: string
  raw: Record<string, string>
}

export default function AdminCetakKartu() {
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [linkByGelombang, setLinkByGelombang] = useState<Record<string, string>>({})
  const [cetakSemua, setCetakSemua] = useState(false)
  const { mode: printMode, print } = useKartuPrint()

  useEffect(() => {
    let cancelled = false
    api.siswa
      .getAll()
      .then((res) => {
        if (cancelled || res.status !== 'ok') return
        const list = (res.data as Array<Record<string, string>>).map((s) => ({
          idPendaftaran: s.id_pendaftaran || '',
          namaLengkap: s.nama_lengkap || '',
          email: s.email || '',
          gelombang: s.gelombang || '-',
          raw: s,
        }))
        setSiswaList(list)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    api.gelombang
      .get()
      .then((res) => {
        if (cancelled || res.status !== 'ok') return
        const rows = res.data as Array<Record<string, string>>
        const map: Record<string, string> = {}
        rows.forEach((g) => {
          map[(g.gelombang || '').trim()] = (g.link_group_wa || '').trim()
        })
        setLinkByGelombang(map)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return siswaList
    return siswaList.filter(
      (s) =>
        s.namaLengkap.toLowerCase().includes(q) ||
        s.idPendaftaran.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    )
  }, [siswaList, search])

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectedRows = useMemo(
    () =>
      selected
        .map((id) => siswaList.find((s) => s.idPendaftaran === id))
        .filter((s): s is SiswaRow => Boolean(s)),
    [selected, siswaList]
  )

  const toKartuData = useCallback(
    (s: SiswaRow): KartuData => {
      const jurusanLabel =
        DATA_JURUSAN.find((j) => j.value === s.raw.pilihan_jurusan)?.label || s.raw.pilihan_jurusan
      return {
        nama: s.namaLengkap || '-',
        email: s.email || 'Tanpa Email',
        idPendaftaran: s.idPendaftaran || '-',
        jurusanLabel,
        gelombang: s.gelombang || '-',
        tahunAjaran: s.raw.tahun_ajaran || '-',
        waktuDaftar: formatWIB(s.raw.waktu_daftar),
        status: s.raw.status_pendaftaran || '-',
        fotoUrl: s.raw.foto_profil_url,
        initials: s.namaLengkap || '?',
        linkGroupWA: linkByGelombang[(s.gelombang || '').trim()] || '',
      }
    },
    [linkByGelombang]
  )

  const cards = useMemo(() => selectedRows.map(toKartuData), [selectedRows, toKartuData])
  const semuaCards = useMemo(() => siswaList.map(toKartuData), [siswaList, toKartuData])

  const cardsToPrint = cetakSemua ? semuaCards : cards
  const printing = printMode !== null

  // Pratinjau selalu mengikuti pilihan; area cetak boleh mengikuti "semua".
  const lembPilihan = cards.length === 0 ? 0 : Math.ceil(cards.length / A4_MAX_CARDS)
  const sisaPilihan = cards.length - (lembPilihan - 1) * A4_MAX_CARDS
  const pratinjauSlots = useMemo(
    () => Array.from({ length: A4_MAX_CARDS }, (_, i) => cards[i] ?? null),
    [cards]
  )
  const sheetsCetak = useMemo(() => chunkIntoSheets(cardsToPrint, A4_MAX_CARDS), [cardsToPrint])

  // Kembalikan ke mode pilihan setelah dialog cetak ditutup (afterprint).
  useEffect(() => {
    if (printMode === null) setCetakSemua(false)
  }, [printMode])

  const cetakPilihan = () => {
    if (!cards.length) return
    setCetakSemua(false)
    print('a4')
  }

  const cetakSemuaSiswa = () => {
    if (!siswaList.length) return
    setCetakSemua(true)
    print('a4')
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="page-fade-in space-y-4">
      <style>{a4SheetCss()}</style>
      {printMode === 'a4' && <style>{a4PrintCss()}</style>}

      <div className="kartu-screen-shell space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-800">Cetak Kartu Massal</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-light px-2.5 py-1 text-[11px] font-semibold text-brand-green-dark">
              <Users className="w-3.5 h-3.5" />
              {selected.length} dipilih
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={cetakSemuaSiswa} disabled={!siswaList.length || printing}>
              <Files className="w-4 h-4" />
              Cetak Semua ({siswaList.length})
            </Button>
            {selected.length > 0 && (
              <Button variant="secondary" onClick={() => setSelected([])} disabled={printing}>
                Bersihkan
              </Button>
            )}
            <Button variant="primary" onClick={cetakPilihan} disabled={!cards.length || printing}>
              <Printer className="w-4 h-4" />
              Cetak A4 ({cards.length} kartu
              {lembPilihan > 0 && ` · ${lembPilihan} lemb`})
            </Button>
          </div>
        </div>

        {cards.length > 0 && (
          <p className="rounded-xl border border-brand-green/25 bg-brand-green-light px-3.5 py-2.5 text-xs text-brand-green-dark">
            {cards.length} kartu akan dicetak pada {lembPilihan} lemb A4 ({A4_GRID_COLS} x{' '}
            {A4_GRID_ROWS} = {A4_MAX_CARDS} kartu per lemb)
            {sisaPilihan < A4_MAX_CARDS &&
              `; lemb terakhir berisi ${sisaPilihan} kartu dan sisanya kosong`}
            .
          </p>
        )}

        <Card className="p-4 print:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, ID pendaftaran, atau email..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-green"
            />
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <Card className="p-2 print:hidden">
            <div className="max-h-[60vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-slate-400">
                  {siswaList.length === 0 ? 'Belum ada data siswa.' : 'Tidak ada siswa yang cocok.'}
                </p>
              ) : (
                filtered.map((s) => {
                  const active = selected.includes(s.idPendaftaran)
                  return (
                    <button
                      key={s.idPendaftaran}
                      type="button"
                      onClick={() => toggle(s.idPendaftaran)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        active ? 'bg-brand-green-light' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                          active ? 'border-brand-green bg-brand-green' : 'border-slate-300'
                        }`}
                      >
                        {active && (
                          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white">
                            <path
                              d="M2 6.2 4.6 8.8 10 3.4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">
                          {s.namaLengkap || '-'}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {s.idPendaftaran} &middot; {s.gelombang}
                        </span>
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </Card>

          <div className="print:hidden">
            <p className="mb-2 text-xs font-semibold text-slate-500">
              Pratinjau A4 ({A4_W_MM} x {A4_H_MM} mm, muat {A4_MAX_CARDS} kartu)
              {lembPilihan > 1 && ` · lemb 1 dari ${lembPilihan}`}
            </p>
            <div
              className="a4-sheet rounded-lg bg-white shadow-lg ring-1 ring-slate-200"
              style={{ width: `${A4_W_MM}mm`, height: `${A4_H_MM}mm` }}
            >
              {pratinjauSlots.map((c, i) =>
                c ? (
                  <BuktiPendaftaranCard key={c.idPendaftaran || i} data={c} />
                ) : (
                  <div
                    key={`kosong-${i}`}
                    className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-[10px] font-semibold text-slate-400"
                  >
                    Slot {i + 1}
                  </div>
                )
              )}
            </div>
            {lembPilihan > 1 && (
              <p className="mt-2 text-[11px] text-slate-400">
                + {cards.length - A4_MAX_CARDS} kartu lagi pada {lembPilihan - 1} lemb berikutnya.
              </p>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 print:hidden">
          Kartu berukuran 65 x 95 mm, {A4_MAX_CARDS} per lemb A4 potret. Potong tepat pada batas
          antar kartu. Jumlah kartu tidak harus kelipatan {A4_MAX_CARDS}.
        </p>
      </div>

      {printMode === 'a4' && sheetsCetak.length > 0 && (
        <div className="kartu-print-root kartu-print-flow">
          {sheetsCetak.map((sheet, sheetIndex) => (
            <div
              key={`lembar-${sheetIndex}`}
              className="a4-sheet"
              style={{ width: `${A4_W_MM}mm`, height: `${A4_H_MM}mm` }}
            >
              {sheet.map((c, i) =>
                c ? (
                  <BuktiPendaftaranCard key={`${sheetIndex}-${c.idPendaftaran}`} data={c} />
                ) : (
                  <div key={`${sheetIndex}-kosong-${i}`} className="kartu-slot-kosong" />
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}