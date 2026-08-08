import { useEffect, useRef, useState } from 'react'
import {
  Search, ClipboardX, Trash2, Loader2, RefreshCw, UserSearch, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Toast from '../../components/ui/Toast'
import { api } from '../../services/api'
import { DATA_JENIS_IZIN } from '../../data/constants'
import type { IzinMpls } from '../../types'

interface SiswaRow {
  id_pendaftaran: string
  nama_lengkap: string
  email: string
  pilihan_jurusan: string
  gelombang: string
  status_pendaftaran: string
}

function todayWIB(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

export default function MplsIzin() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [allSiswa, setAllSiswa] = useState<SiswaRow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SiswaRow[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [selected, setSelected] = useState<SiswaRow | null>(null)
  const [selectedIzin, setSelectedIzin] = useState<IzinMpls[]>([])
  const [izinList, setIzinList] = useState<IzinMpls[]>([])
  const [jenisIzin, setJenisIzin] = useState(DATA_JENIS_IZIN[0])
  const [catatanIzin, setCatatanIzin] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  const loadIzinList = async () => {
    try {
      const res = await api.mpls.getIzin(todayWIB())
      if (res.status === 'ok') setIzinList((res.data as IzinMpls[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data izin')
    }
  }

  const loadSiswaIzin = async (s: SiswaRow) => {
    try {
      const res = await api.mpls.lookupById(s.id_pendaftaran)
      if (res.status === 'ok') {
        const data = res.data as { izin_hari_ini?: IzinMpls[] }
        setSelectedIzin(data.izin_hari_ini || [])
      } else {
        setSelectedIzin([])
      }
    } catch {
      setSelectedIzin([])
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError('')
      try {
        const [siswaRes, izinRes] = await Promise.all([
          api.siswa.getAll(),
          api.mpls.getIzin(todayWIB()),
        ])
        if (siswaRes.status === 'ok') setAllSiswa((siswaRes.data as SiswaRow[]) || [])
        if (izinRes.status === 'ok') setIzinList((izinRes.data as IzinMpls[]) || [])
      } catch (err) {
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'Gagal memuat data. Pastikan VITE_API_URL menunjuk ke deployment backend terbaru.',
        )
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase()
    setHasSearched(true)
    if (!q) {
      setSearchResults([])
      setSelected(null)
      setSelectedIzin([])
      return
    }
    const results = allSiswa.filter((s) =>
      (s.id_pendaftaran || '').toLowerCase().includes(q) ||
      (s.nama_lengkap || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q),
    )
    setSearchResults(results)
    setSelected(null)
    setSelectedIzin([])
  }

  const selectStudent = async (s: SiswaRow) => {
    setSelected(s)
    setHasSearched(false)
    setJenisIzin(DATA_JENIS_IZIN[0])
    setCatatanIzin('')
    setSelectedIzin([])
    await loadSiswaIzin(s)
  }

  const submitIzin = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await api.mpls.addIzin({
        id_pendaftaran: selected.id_pendaftaran,
        jenis_izin: jenisIzin,
        catatan: catatanIzin.trim(),
        diinput_oleh: user?.nama || user?.email || '',
      })
      if (res.status === 'ok') {
        const data = res.data as IzinMpls
        setSelectedIzin((prev) => [...prev, data])
        setCatatanIzin('')
        showToast('success', `Izin dicatat — ${selected.nama_lengkap} (${jenisIzin})`)
        await loadIzinList()
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal mencatat izin')
    } finally {
      setSaving(false)
    }
  }

  const hapusIzin = async (idIzin: string) => {
    if (!window.confirm('Hapus catatan izin ini?')) return
    try {
      const res = await api.mpls.deleteIzin(idIzin)
      if (res.status === 'ok') {
        setIzinList((prev) => prev.filter((i) => i.id_izin !== idIzin))
        setSelectedIzin((prev) => prev.filter((i) => i.id_izin !== idIzin))
        showToast('success', 'Izin berhasil dihapus')
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus izin')
    }
  }

  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      const [siswaRes, izinRes] = await Promise.all([
        api.siswa.getAll(),
        api.mpls.getIzin(todayWIB()),
      ])
      if (siswaRes.status === 'ok') setAllSiswa((siswaRes.data as SiswaRow[]) || [])
      if (izinRes.status === 'ok') setIzinList((izinRes.data as IzinMpls[]) || [])
      if (selected) await loadSiswaIzin(selected)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat ulang data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Izin MPLS</h1>
          <p className="text-sm text-slate-500">
            Catat siswa yang berhalangan mengikuti MPLS (sakit, keperluan keluarga, dll.)
          </p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Muat Ulang
        </button>
      </div>

      {error && (
        <Card className="p-4 border-red-100 bg-red-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-600">Gagal memuat data</p>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-brand-green mx-auto mt-10" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <UserSearch className="w-4 h-4 text-brand-green" />
              Cari Siswa
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ID pendaftaran / nama / email"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
              <Button variant="secondary" onClick={handleSearch}>
                <Search className="w-4 h-4" />
                Cari
              </Button>
            </div>

            {hasSearched && searchResults.length > 0 && !selected && (
              <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-50 rounded-xl border border-slate-100">
                {searchResults.map((s) => (
                  <button
                    key={s.id_pendaftaran}
                    onClick={() => selectStudent(s)}
                    className="w-full text-left px-3 py-2.5 hover:bg-brand-green-light/40 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-800">{s.nama_lengkap || '-'}</p>
                    <p className="text-xs text-brand-green">{s.id_pendaftaran} · {s.email}</p>
                    <p className="text-xs text-slate-500">Jurusan: {s.pilihan_jurusan || '-'}</p>
                  </button>
                ))}
              </div>
            )}

            {hasSearched && searchResults.length === 0 && !selected && (
              <p className="text-sm text-slate-400 text-center py-6">
                Tidak ada siswa yang cocok dengan pencarian "{searchQuery.trim()}"
              </p>
            )}

            {!hasSearched && !selected && (
              <p className="text-xs text-slate-400 mt-3">
                Ketik ID pendaftaran, nama, atau email siswa, lalu klik Cari.
              </p>
            )}

            {selected && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green" />
                    {selected.nama_lengkap || '-'}
                  </h4>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-xs text-slate-400 hover:text-brand-green transition-colors"
                  >
                    Ganti Siswa
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                  <p><span className="text-slate-400">ID:</span> {selected.id_pendaftaran}</p>
                  <p><span className="text-slate-400">Email:</span> {selected.email || '-'}</p>
                  <p><span className="text-slate-400">Jurusan:</span> {selected.pilihan_jurusan || '-'}</p>
                  <p><span className="text-slate-400">Gelombang:</span> {selected.gelombang || '-'}</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-green-light text-brand-green-dark text-xs font-medium">
                    Jurusan: {selected.pilihan_jurusan || '-'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                    {selected.status_pendaftaran || '-'}
                  </span>
                </div>

                {selectedIzin.length > 0 ? (
                  <div className="space-y-2">
                    {selectedIzin.map((izin) => (
                      <div
                        key={izin.id_izin}
                        className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-sm"
                      >
                        <ClipboardX className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{izin.jenis_izin}</p>
                          {izin.catatan && <p className="text-xs mt-0.5">{izin.catatan}</p>}
                          <p className="text-xs mt-1 text-slate-500">
                            Dicatat oleh {izin.diinput_oleh || '-'} · {String(izin.created_at).slice(0, 5)}
                          </p>
                        </div>
                        <button
                          onClick={() => hapusIzin(izin.id_izin)}
                          className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                          title="Hapus izin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                        Jenis Izin
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {DATA_JENIS_IZIN.map((j) => (
                          <button
                            key={j}
                            type="button"
                            onClick={() => setJenisIzin(j)}
                            className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                              jenisIzin === j
                                ? 'border-brand-green bg-brand-green-light text-brand-green-dark'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {j}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                        Catatan <span className="text-slate-400">(opsional)</span>
                      </label>
                      <textarea
                        value={catatanIzin}
                        onChange={(e) => setCatatanIzin(e.target.value)}
                        rows={3}
                        placeholder="Lama izin, surat keterangan, dll."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none"
                      />
                    </div>
                    <Button fullWidth onClick={submitIzin} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardX className="w-4 h-4" />}
                      Simpan Izin
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <ClipboardX className="w-4 h-4 text-amber-600" />
                Izin Hari Ini
              </h3>
              <span className="text-xs text-slate-400">{izinList.length} catatan</span>
            </div>

            {izinList.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada siswa izin hari ini</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="pb-2 pr-3 font-medium">No</th>
                      <th className="pb-2 pr-3 font-medium">Nama</th>
                      <th className="pb-2 pr-3 font-medium">Jenis</th>
                      <th className="pb-2 pr-3 font-medium">Jam</th>
                      <th className="pb-2 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {izinList.map((izin, i) => (
                      <tr key={izin.id_izin} className="border-b border-slate-50">
                        <td className="py-2.5 pr-3 text-slate-500">{i + 1}</td>
                        <td className="py-2.5 pr-3">
                          <p className="text-slate-700 font-medium">{izin.nama_lengkap}</p>
                          <p className="text-xs text-slate-400">{izin.id_pendaftaran}</p>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                            <ClipboardX className="w-3 h-3" />
                            {izin.jenis_izin}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-slate-600">
                          {String(izin.created_at).slice(0, 5)}
                        </td>
                        <td className="py-2.5">
                          <button
                            onClick={() => hapusIzin(izin.id_izin)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            title="Hapus izin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
