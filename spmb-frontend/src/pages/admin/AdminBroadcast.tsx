import { useEffect, useState, useRef } from 'react'
import { ImagePlus, CheckCircle2, Trash2, X, Loader2, Pencil, Calendar, Clock, MapPin } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { api } from '../../services/api'
import { compressAndCropImage } from '../../utils/imageCompress'
import { formatWIBShort } from '../../utils/dateUtils'

interface EventItem {
  id_event: string
  target_gelombang: string
  judul: string
  deskripsi: string
  gambar_url: string
  tanggal_pelaksanaan: string
  waktu_pelaksanaan: string
  tempat_pelaksanaan: string
  status_kirim: string
  created_at: string
}

interface GelombangItem {
  gelombang: string
}

export default function AdminBroadcast() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [gelombangList, setGelombangList] = useState<GelombangItem[]>([])
  const [loading, setLoading] = useState(true)
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [target, setTarget] = useState('Semua')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [tanggalPelaksanaan, setTanggalPelaksanaan] = useState('')
  const [waktuPelaksanaan, setWaktuPelaksanaan] = useState('')
  const [tempatPelaksanaan, setTempatPelaksanaan] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sentTimer = useRef<ReturnType<typeof setTimeout>>()

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [editJudul, setEditJudul] = useState('')
  const [editDeskripsi, setEditDeskripsi] = useState('')
  const [editTarget, setEditTarget] = useState('Semua')
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null)
  const [editCompressing, setEditCompressing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editTanggalPelaksanaan, setEditTanggalPelaksanaan] = useState('')
  const [editWaktuPelaksanaan, setEditWaktuPelaksanaan] = useState('')
  const [editTempatPelaksanaan, setEditTempatPelaksanaan] = useState('')
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = async () => {
    try {
      const [eventsRes, gelRes] = await Promise.all([
        api.broadcast.getEvents(),
        api.gelombang.get(),
      ])
      if (eventsRes.status === 'ok') {
        setEvents(eventsRes.data as EventItem[])
      }
      if (gelRes.status === 'ok') {
        setGelombangList(gelRes.data as GelombangItem[])
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    return () => clearTimeout(sentTimer.current)
  }, [])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCompressing(true)
    try {
      const base64 = await compressAndCropImage(file, { maxWidth: 300, quality: 0.45 })
      setImageBase64(base64)
      setImagePreview(`data:image/jpeg;base64,${base64}`)
    } catch {
      alert('Gagal memproses gambar')
    } finally {
      setCompressing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setImageBase64(null)
  }

  const handleSend = async () => {
    if (!judul || !deskripsi) {
      alert('Judul dan deskripsi harus diisi')
      return
    }

    setSending(true)
    try {
      let gambarUrl = ''
      if (imageBase64) {
        try {
          const upRes = await api.upload(`event-${Date.now()}.jpg`, 'image/jpeg', imageBase64)
          if (upRes.status === 'ok') {
            gambarUrl = (upRes.data as { fileUrl: string }).fileUrl
          }
        } catch {
          gambarUrl = `data:image/jpeg;base64,${imageBase64}`
        }
      }

      await api.broadcast.send(judul, deskripsi, target, gambarUrl, tanggalPelaksanaan, waktuPelaksanaan, tempatPelaksanaan)

      api.broadcast.getEvents().then((res) => {
        if (res.status === 'ok') setEvents(res.data as EventItem[])
      }).catch(() => {
        // Refresh list gagal, jangan anggap postingan gagal
      })

      setSent(true)
      setJudul('')
      setDeskripsi('')
      setTarget('Semua')
      setTanggalPelaksanaan('')
      setWaktuPelaksanaan('')
      setTempatPelaksanaan('')
      setImagePreview(null)
      setImageBase64(null)
      sentTimer.current = setTimeout(() => setSent(false), 3000)
    } catch {
      alert('Gagal memposting')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (idEvent: string) => {
    if (!confirm('Yakin ingin menghapus postingan ini?')) return
    setDeletingId(idEvent)
    try {
      const res = await api.broadcast.delete(idEvent)
      if (res.status === 'ok') {
        setEvents(res.data as EventItem[])
      }
    } catch {
      alert('Gagal menghapus postingan')
    } finally {
      setDeletingId(null)
    }
  }

  const openEdit = (event: EventItem) => {
    setEditingEvent(event)
    setEditJudul(event.judul)
    setEditDeskripsi(event.deskripsi)
    setEditTarget(event.target_gelombang)
    setEditTanggalPelaksanaan(event.tanggal_pelaksanaan || '')
    setEditWaktuPelaksanaan(event.waktu_pelaksanaan || '')
    setEditTempatPelaksanaan(event.tempat_pelaksanaan || '')
    setEditImagePreview(event.gambar_url || null)
    setEditImageBase64(null)
    setEditModalOpen(true)
  }

  const closeEdit = () => {
    setEditModalOpen(false)
    setEditingEvent(null)
    setEditJudul('')
    setEditDeskripsi('')
    setEditTarget('Semua')
    setEditTanggalPelaksanaan('')
    setEditWaktuPelaksanaan('')
    setEditTempatPelaksanaan('')
    setEditImagePreview(null)
    setEditImageBase64(null)
  }

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setEditCompressing(true)
    try {
      const base64 = await compressAndCropImage(file, { maxWidth: 300, quality: 0.45 })
      setEditImageBase64(base64)
      setEditImagePreview(`data:image/jpeg;base64,${base64}`)
    } catch {
      alert('Gagal memproses gambar')
    } finally {
      setEditCompressing(false)
      if (editFileInputRef.current) editFileInputRef.current.value = ''
    }
  }

  const handleEditRemoveImage = () => {
    setEditImagePreview(null)
    setEditImageBase64(null)
  }

  const handleSaveEdit = async () => {
    if (!editingEvent) return
    if (!editJudul || !editDeskripsi) {
      alert('Judul dan deskripsi harus diisi')
      return
    }

    setSaving(true)
    try {
      let gambarUrl = editingEvent.gambar_url || ''
      if (editImageBase64) {
        try {
          const upRes = await api.upload(`event-${Date.now()}.jpg`, 'image/jpeg', editImageBase64)
          if (upRes.status === 'ok') {
            gambarUrl = (upRes.data as { fileUrl: string }).fileUrl
          }
        } catch {
          gambarUrl = `data:image/jpeg;base64,${editImageBase64}`
        }
      } else if (editImagePreview === null && editingEvent.gambar_url) {
        gambarUrl = ''
      }

      const res = await api.broadcast.update(editingEvent.id_event, {
        judul: editJudul,
        deskripsi: editDeskripsi,
        target_gelombang: editTarget,
        gambar_url: gambarUrl,
        tanggal_pelaksanaan: editTanggalPelaksanaan,
        waktu_pelaksanaan: editWaktuPelaksanaan,
        tempat_pelaksanaan: editTempatPelaksanaan,
      })
      if (res.status === 'ok') {
        setEvents(res.data as EventItem[])
      }
      closeEdit()
    } catch {
      alert('Gagal memperbarui postingan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-fade-in space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Manajemen Postingan</h1>
        <p className="text-sm text-slate-500">Kelola postingan informasi untuk calon siswa</p>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Buat Postingan Baru
        </h3>

        <div className="space-y-4 max-w-lg">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Target Gelombang</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            >
              <option value="Semua">Semua Gelombang</option>
              {gelombangList.map((gel) => (
                <option key={gel.gelombang} value={gel.gelombang}>
                  {gel.gelombang}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Judul</label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Jadwal Verifikasi Berkas"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Deskripsi</label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Detail informasi untuk calon siswa..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Tanggal Pelaksanaan
              </label>
              <input
                type="date"
                value={tanggalPelaksanaan}
                onChange={(e) => setTanggalPelaksanaan(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Waktu Pelaksanaan
              </label>
              <input
                type="time"
                value={waktuPelaksanaan}
                onChange={(e) => setWaktuPelaksanaan(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Tempat Pelaksanaan
              </label>
              <input
                type="text"
                value={tempatPelaksanaan}
                onChange={(e) => setTempatPelaksanaan(e.target.value)}
                placeholder="Contoh: Aula Sekolah"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Gambar (Opsional)</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-80 object-cover"
                  style={{ aspectRatio: '4 / 5', objectFit: 'cover' }}
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  compressing
                    ? 'border-brand-green bg-brand-green-light/50'
                    : 'border-slate-200 hover:border-brand-green hover:bg-brand-green-light/30'
                }`}
              >
                {compressing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                    <span className="text-xs text-slate-500">Mengkompresi gambar...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImagePlus className="w-8 h-8 text-slate-400" />
                    <span className="text-xs text-slate-500">Klik untuk memilih gambar</span>
                    <span className="text-[10px] text-slate-400">Format 4:5, otomatis terkompresi</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={compressing}
                />
              </label>
            )}
          </div>

          <Button
            onClick={handleSend}
            loading={sending}
            disabled={compressing}
          >
            {sent ? '✓ Terbitkan!' : 'Terbitkan'}
          </Button>

          {sent && (
            <div className="flex items-center gap-2 text-sm text-brand-green">
              <CheckCircle2 className="w-4 h-4" />
              Postingan berhasil diterbitkan
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Semua Postingan
        </h3>

        {loading ? (
          <Loader />
        ) : (
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada postingan</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id_event}
                  className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  {event.gambar_url && (
                    <div className="sm:w-32 sm:h-40 w-full h-48 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                      <img
                        src={event.gambar_url}
                        alt={event.judul}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{event.judul}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-3">{event.deskripsi}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(event)}
                          className="p-1.5 text-slate-400 hover:text-brand-green transition-colors"
                          title="Edit postingan"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id_event)}
                          disabled={deletingId === event.id_event}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Hapus postingan"
                        >
                          {deletingId === event.id_event ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-green-light text-brand-green-dark font-medium">
                        {event.target_gelombang}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                        {event.status_kirim}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatWIBShort(event.created_at)}
                      </span>
                    </div>
                    {(event.tanggal_pelaksanaan || event.waktu_pelaksanaan || event.tempat_pelaksanaan) && (
                      <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px] text-slate-500">
                        {event.tanggal_pelaksanaan && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {event.tanggal_pelaksanaan}
                          </span>
                        )}
                        {event.waktu_pelaksanaan && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.waktu_pelaksanaan}
                          </span>
                        )}
                        {event.tempat_pelaksanaan && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.tempat_pelaksanaan}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {editModalOpen && editingEvent && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Edit Postingan</h3>
              <button onClick={closeEdit}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">Target Gelombang</label>
                <select
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                >
                  <option value="Semua">Semua Gelombang</option>
                  {gelombangList.map((gel) => (
                    <option key={gel.gelombang} value={gel.gelombang}>
                      {gel.gelombang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">Judul</label>
                <input
                  type="text"
                  value={editJudul}
                  onChange={(e) => setEditJudul(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">Deskripsi</label>
                <textarea
                  value={editDeskripsi}
                  onChange={(e) => setEditDeskripsi(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={editTanggalPelaksanaan}
                    onChange={(e) => setEditTanggalPelaksanaan(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Waktu
                  </label>
                  <input
                    type="time"
                    value={editWaktuPelaksanaan}
                    onChange={(e) => setEditWaktuPelaksanaan(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    Tempat
                  </label>
                  <input
                    type="text"
                    value={editTempatPelaksanaan}
                    onChange={(e) => setEditTempatPelaksanaan(e.target.value)}
                    placeholder="Aula Sekolah"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">Gambar (Opsional)</label>
                {editImagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="w-full max-h-60 object-cover"
                      style={{ aspectRatio: '4 / 5', objectFit: 'cover' }}
                    />
                    <button
                      onClick={handleEditRemoveImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      editCompressing
                        ? 'border-brand-green bg-brand-green-light/50'
                        : 'border-slate-200 hover:border-brand-green hover:bg-brand-green-light/30'
                    }`}
                  >
                    {editCompressing ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-brand-green animate-spin" />
                        <span className="text-xs text-slate-500">Mengkompresi...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ImagePlus className="w-6 h-6 text-slate-400" />
                        <span className="text-xs text-slate-500">Pilih gambar baru</span>
                      </div>
                    )}
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageSelect}
                      className="hidden"
                      disabled={editCompressing}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" className="flex-1" onClick={closeEdit}>
                Batal
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleSaveEdit} loading={saving} disabled={editCompressing}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
