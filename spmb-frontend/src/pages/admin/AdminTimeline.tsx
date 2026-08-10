import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, Check, X, ListOrdered, Calendar } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { api } from '../../services/api'
import { formatWIBShort, formatWIBDateInput } from '../../utils/dateUtils'

interface TimelineItem {
  id_timeline: string
  urutan: string
  nama_tahapan: string
  deskripsi: string
  tanggal_mulai: string
  tanggal_selesai: string
  status: string
}

const defaultForm = {
  urutan: '',
  nama_tahapan: '',
  deskripsi: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
  status: 'Aktif' as string,
}

export default function AdminTimeline() {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.timeline.get()
      if (res.status === 'ok') {
        setItems(res.data as TimelineItem[])
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

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...defaultForm })
    setModalOpen(true)
  }

  const openEdit = (item: TimelineItem) => {
    setEditingId(item.id_timeline)
    setForm({
      urutan: item.urutan || '',
      nama_tahapan: item.nama_tahapan || '',
      deskripsi: item.deskripsi || '',
      tanggal_mulai: formatWIBDateInput(item.tanggal_mulai),
      tanggal_selesai: formatWIBDateInput(item.tanggal_selesai),
      status: item.status || 'Aktif',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm({ ...defaultForm })
  }

  const handleSave = async () => {
    if (!form.nama_tahapan.trim()) {
      alert('Nama tahapan wajib diisi')
      return
    }
    if (form.urutan && !/^\d+$/.test(form.urutan.trim())) {
      alert('Urutan harus berupa angka')
      return
    }

    setSaving(true)
    try {
      const payload = {
        urutan: form.urutan || '1',
        nama_tahapan: form.nama_tahapan.trim(),
        deskripsi: form.deskripsi,
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        status: form.status,
      }
      if (editingId) {
        await api.timeline.update(editingId, payload)
      } else {
        await api.timeline.add(payload)
      }
      closeModal()
      await fetchData()
    } catch (err) {
      alert('Gagal menyimpan tahapan: ' + (err instanceof Error ? err.message : err))
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (idTimeline: string) => {
    try {
      const item = items.find((i) => i.id_timeline === idTimeline)
      const newStatus = item?.status === 'Aktif' ? 'Non-Aktif' : 'Aktif'
      await api.timeline.update(idTimeline, { status: newStatus })
      await fetchData()
    } catch (err) {
      alert('Gagal mengubah status: ' + (err instanceof Error ? err.message : err))
    }
  }

  const handleDelete = async (idTimeline: string) => {
    if (!confirm('Yakin ingin menghapus tahapan ini?')) return
    try {
      await api.timeline.delete(idTimeline)
      await fetchData()
    } catch (err) {
      alert('Gagal menghapus tahapan: ' + (err instanceof Error ? err.message : err))
    }
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Timeline SPMB</h1>
          <p className="text-sm text-slate-500">Atur tahapan-tahapan SPMB yang ditampilkan ke siswa</p>
        </div>
        <Button variant="primary" className="text-sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Tambah Tahapan
        </Button>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Daftar Tahapan
        </h3>

        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada tahapan. Tambahkan tahapan SPMB.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id_timeline}
                className={`flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-xl border ${
                  item.status === 'Aktif' ? 'bg-slate-50 border-slate-100' : 'bg-slate-50/60 border-slate-100 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3 sm:pt-0.5">
                  <div className="w-9 h-9 rounded-full bg-brand-green-light text-brand-green flex items-center justify-center font-bold text-sm shrink-0">
                    {item.urutan || '•'}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">{item.nama_tahapan}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-brand-green transition-colors"
                        title="Edit tahapan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id_timeline)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        title="Hapus tahapan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleStatus(item.id_timeline)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                          item.status === 'Aktif'
                            ? 'bg-brand-green-light text-brand-green-dark'
                            : 'bg-slate-200 text-slate-500 hover:bg-brand-green-light hover:text-brand-green-dark'
                        }`}
                        title={item.status === 'Aktif' ? 'Klik untuk menyembunyikan' : 'Klik untuk menampilkan'}
                      >
                        {item.status === 'Aktif' ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" /> Tampil
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <X className="w-3 h-3" /> Sembunyi
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {item.deskripsi && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3">{item.deskripsi}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] text-slate-500">
                    {(item.tanggal_mulai || item.tanggal_selesai) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.tanggal_mulai ? formatWIBShort(item.tanggal_mulai) : '...'}
                        {item.tanggal_selesai ? ` — ${formatWIBShort(item.tanggal_selesai)}` : ''}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <ListOrdered className="w-3 h-3" />
                      Urutan {item.urutan || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? 'Edit Tahapan' : 'Tambah Tahapan'}
              </h3>
              <button onClick={closeModal}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Urutan</label>
                  <input
                    type="number"
                    min={1}
                    value={form.urutan}
                    onChange={(e) => setForm({ ...form, urutan: e.target.value })}
                    placeholder="1"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Tahapan</label>
                  <input
                    type="text"
                    value={form.nama_tahapan}
                    onChange={(e) => setForm({ ...form, nama_tahapan: e.target.value })}
                    placeholder="Contoh: Pendaftaran Online"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Deskripsi</label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  rows={3}
                  placeholder="Penjelasan singkat tahapan ini..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                >
                  <option value="Aktif">Aktif (ditampilkan ke siswa)</option>
                  <option value="Non-Aktif">Non-Aktif (disembunyikan)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" className="flex-1" onClick={closeModal}>
                Batal
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
