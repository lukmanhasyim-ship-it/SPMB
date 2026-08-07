import { useEffect, useState, useRef } from 'react'
import { ImagePlus, Trash2, X, Loader2, Send, Calendar, Clock, MapPin } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { api } from '../../services/api'
import { compressAndCropImage } from '../../utils/imageCompress'
import { formatWIBShort, formatWIBTime } from '../../utils/dateUtils'

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

export default function MplsInformasi() {
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
    if (!confirm('Yakin ingin menghapus informasi ini?')) return
    setDeletingId(idEvent)
    try {
      const res = await api.broadcast.delete(idEvent)
      if (res.status === 'ok') {
        setEvents(res.data as EventItem[])
      }
    } catch {
      alert('Gagal menghapus informasi')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Informasi untuk Siswa Baru</h1>
        <p className="text-sm text-slate-500">
          Buat pengumuman atau informasi yang akan tampil di portal siswa baru.
        </p>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Buat Informasi Baru</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Judul</label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Jadwal MPLS Hari Pertama"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Deskripsi</label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              placeholder="Tuliskan detail informasi yang ingin disampaikan..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Target Gelombang</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              >
                <option value="Semua">Semua</option>
                {gelombangList.map((g) => (
                  <option key={g.gelombang} value={g.gelombang}>{g.gelombang}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Tanggal Kegiatan
              </label>
              <input
                type="date"
                value={tanggalPelaksanaan}
                onChange={(e) => setTanggalPelaksanaan(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Waktu
              </label>
              <input
                type="time"
                value={waktuPelaksanaan}
                onChange={(e) => setWaktuPelaksanaan(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Tempat Kegiatan
            </label>
            <input
              type="text"
              value={tempatPelaksanaan}
              onChange={(e) => setTempatPelaksanaan(e.target.value)}
              placeholder="Contoh: Aula SMKS Al Azhar Sempu"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Gambar (Opsional)</label>
            {imagePreview ? (
              <div className="relative w-full max-w-[300px]">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors border-slate-200 hover:border-brand-green hover:bg-brand-green-light/30">
                {compressing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-brand-green animate-spin" />
                    <span className="text-xs text-slate-500">Memproses gambar...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <ImagePlus className="w-6 h-6 text-slate-400" />
                    <span className="text-xs text-slate-500">Klik untuk memilih gambar</span>
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

          <div className="flex items-center gap-3">
            <Button onClick={handleSend} loading={sending}>
              <Send className="w-4 h-4" />
              Kirim Informasi
            </Button>
            {sent && (
              <span className="text-xs font-medium text-brand-green flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5" />
                Informasi berhasil diposting!
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Daftar Informasi Terkirim</h3>
        {loading ? (
          <Loader className="min-h-[20vh]" />
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Belum ada informasi yang diposting</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id_event} className="flex items-start justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{event.judul}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-green-light text-brand-green-dark shrink-0">
                      {event.target_gelombang || 'Semua'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{event.deskripsi}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {event.tanggal_pelaksanaan ? `${formatWIBShort(event.tanggal_pelaksanaan)}${event.waktu_pelaksanaan ? ` • ${formatWIBTime(event.waktu_pelaksanaan)}` : ''}${event.tempat_pelaksanaan ? ` • ${event.tempat_pelaksanaan}` : ''}` : formatWIBShort(event.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(event.id_event)}
                  disabled={deletingId === event.id_event}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                >
                  {deletingId === event.id_event ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
