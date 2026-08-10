import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, Check, X, MessageCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { api } from '../../services/api'
import { formatWIBShort } from '../../utils/dateUtils'

interface GelombangItem {
  gelombang: string
  tanggal_mulai: string
  tanggal_selesai: string
  link_group_wa: string
  status: string
}

const defaultForm = {
  gelombang: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
  link_group_wa: '',
  status: 'Non-Aktif' as string,
}

const monthMap: Record<string, string> = {
  Januari: '01', Februari: '02', Maret: '03', April: '04',
  Mei: '05', Juni: '06', Juli: '07', Agustus: '08',
  September: '09', Oktober: '10', November: '11', Desember: '12',
}

function parseDate(dateStr: string): string {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  const parts = dateStr.split(' ')
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const month = monthMap[parts[1]] || '01'
    return `${parts[2]}-${month}-${day}`
  }
  return dateStr
}

function displayDate(dateStr: string): string {
  return formatWIBShort(dateStr)
}

export default function AdminGelombang() {
  const [gelombangList, setGelombangList] = useState<GelombangItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLinkGel, setEditingLinkGel] = useState<string | null>(null)
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingGelombang, setEditingGelombang] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)

  const fetchData = async (skipConfig = false) => {
    try {
      const [gelRes, configRes] = await Promise.all([
        api.gelombang.get(),
        skipConfig ? Promise.resolve(null) : api.config.get(),
      ])
      if (gelRes.status === 'ok') {
        setGelombangList(gelRes.data as GelombangItem[])
      }
      if (configRes?.status === 'ok') {
        const config = configRes.data as Record<string, string>
        if (config.TAHUN_AJARAN_AKTIF) setTahunAjaran(config.TAHUN_AJARAN_AKTIF)
      }
    } catch (err) {
      alert('Gagal memuat data: ' + (err instanceof Error ? err.message : err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const toggleStatus = async (gelombang: string) => {
    try {
      const item = gelombangList.find((g) => g.gelombang === gelombang)
      const newStatus = item?.status === 'Aktif' ? 'Non-Aktif' : 'Aktif'
      await api.gelombang.update({ gelombang, status: newStatus })
      await fetchData(true)
    } catch (err) {
      alert('Gagal mengubah status: ' + (err instanceof Error ? err.message : err))
    }
  }

  const handleSimpanTahunAjaran = async () => {
    try {
      await api.config.update('TAHUN_AJARAN_AKTIF', tahunAjaran)
      alert('Tahun ajaran berhasil disimpan')
    } catch (err) {
      alert('Gagal menyimpan tahun ajaran: ' + (err instanceof Error ? err.message : err))
    }
  }

  const handleSaveLinkWA = async (gelombang: string, link: string) => {
    try {
      await api.gelombang.update({ gelombang, link_group_wa: link })
      await fetchData(true)
    } catch (err) {
      alert('Gagal menyimpan link WA: ' + (err instanceof Error ? err.message : err))
    }
    setEditingLinkGel(null)
  }

  const openAdd = () => {
    setEditingGelombang(null)
    setForm({ ...defaultForm })
    setModalOpen(true)
  }

  const openEdit = (gel: GelombangItem) => {
    setEditingGelombang(gel.gelombang)
    setForm({
      gelombang: gel.gelombang,
      tanggal_mulai: parseDate(gel.tanggal_mulai),
      tanggal_selesai: parseDate(gel.tanggal_selesai),
      link_group_wa: gel.link_group_wa,
      status: gel.status,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const name = editingGelombang || form.gelombang
    if (!name.trim()) {
      alert('Nama gelombang wajib diisi')
      return
    }

    try {
      await api.gelombang.update({
        gelombang: name,
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        link_group_wa: form.link_group_wa,
        status: form.status,
      })
      setModalOpen(false)
      await fetchData(true)
    } catch (err) {
      alert('Gagal menyimpan gelombang: ' + (err instanceof Error ? err.message : err))
    }
  }

  const handleDelete = async (gelombang: string) => {
    if (!confirm(`Yakin ingin menghapus ${gelombang}?`)) return
    try {
      await api.gelombang.delete(gelombang)
      await fetchData(true)
    } catch (err) {
      alert('Gagal menghapus gelombang: ' + (err instanceof Error ? err.message : err))
    }
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manajemen Gelombang</h1>
          <p className="text-sm text-slate-500">Atur jadwal, status, dan periode gelombang pendaftaran</p>
        </div>
        <Button variant="primary" className="text-sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Tambah Gelombang
        </Button>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Tahun Ajaran Aktif
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={tahunAjaran}
            onChange={(e) => setTahunAjaran(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
          />
          <Button variant="primary" className="text-sm" onClick={handleSimpanTahunAjaran}>
            <Check className="w-4 h-4" />
            Simpan
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {gelombangList.map((gel) => (
          <Card key={gel.gelombang} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{gel.gelombang}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {displayDate(gel.tanggal_mulai)} — {displayDate(gel.tanggal_selesai)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(gel)}
                  className="p-1.5 text-slate-400 hover:text-brand-green transition-colors"
                  title="Edit gelombang"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(gel.gelombang)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  title="Hapus gelombang"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleStatus(gel.gelombang)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    gel.status === 'Aktif'
                      ? 'bg-brand-green-light text-brand-green-dark ring-2 ring-brand-green-light'
                      : 'bg-brand-green-light text-brand-green-dark hover:bg-brand-green hover:text-white border-2 border-brand-green/30'
                  }`}
                >
                  {gel.status === 'Aktif' ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> Aktif
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <X className="w-3 h-3" /> Non-Aktif
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-slate-400 shrink-0" />
              {editingLinkGel === gel.gelombang ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    defaultValue={gel.link_group_wa}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    onBlur={(e) => handleSaveLinkWA(gel.gelombang, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveLinkWA(gel.gelombang, (e.target as HTMLInputElement).value)
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    onClick={() => setEditingLinkGel(null)}
                    className="text-xs"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-xs text-blue-600 flex-1 truncate">
                    {gel.link_group_wa}
                  </span>
                  <button
                    onClick={() => setEditingLinkGel(gel.gelombang)}
                    className="text-brand-green hover:text-brand-green-dark transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </Card>
        ))}
        {gelombangList.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">Belum ada gelombang</p>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                {editingGelombang ? 'Edit Gelombang' : 'Tambah Gelombang'}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Gelombang</label>
                <input
                  type="text"
                  value={form.gelombang}
                  onChange={(e) => setForm({ ...form, gelombang: e.target.value })}
                  disabled={!!editingGelombang}
                  placeholder="Gelombang 4"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Tanggal Mulai</label>
                <input
                  type="date"
                  value={form.tanggal_mulai}
                  onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Tanggal Selesai</label>
                <input
                  type="date"
                  value={form.tanggal_selesai}
                  onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Link Group WA</label>
                <input
                  type="text"
                  value={form.link_group_wa}
                  onChange={(e) => setForm({ ...form, link_group_wa: e.target.value })}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleSave}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
