import { useEffect, useState } from 'react'
import { Send, Mail, CheckCircle2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { api } from '../../services/api'

interface EventItem {
  id_event: string
  target_gelombang: string
  judul: string
  deskripsi: string
  status_kirim: string
  created_at: string
}

export default function AdminBroadcast() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [target, setTarget] = useState('Semua')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.broadcast.getEvents()
        if (res.status === 'ok') {
          setEvents(res.data as EventItem[])
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSend = async () => {
    if (!judul || !deskripsi) {
      alert('Judul dan deskripsi harus diisi')
      return
    }
    setSending(true)
    try {
      await api.broadcast.send(judul, deskripsi, target)
      setSent(true)
      setJudul('')
      setDeskripsi('')
      setTimeout(() => setSent(false), 3000)
      const res = await api.broadcast.getEvents()
      if (res.status === 'ok') {
        setEvents(res.data as EventItem[])
      }
    } catch {
      alert('Gagal mengirim notifikasi')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Broadcast Notifikasi</h1>
        <p className="text-sm text-slate-500">Kirim pengumuman ke calon siswa</p>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Kirim Notifikasi Baru
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
              <option value="Gelombang 1">Gelombang 1</option>
              <option value="Gelombang 2">Gelombang 2</option>
              <option value="Gelombang 3">Gelombang 3</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Judul Event</label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Verifikasi Berkas Fisik"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Deskripsi</label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Detail pengumuman..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none"
            />
          </div>

          <Button
            onClick={handleSend}
            loading={sending}
          >
            <Send className="w-4 h-4" />
            {sent ? 'Terkirim!' : 'Kirim Notifikasi'}
          </Button>

          {sent && (
            <div className="flex items-center gap-2 text-sm text-brand-green">
              <CheckCircle2 className="w-4 h-4" />
              Notifikasi berhasil dikirim
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Riwayat Notifikasi
        </h3>

        {loading ? (
          <p className="text-sm text-slate-400">Memuat data...</p>
        ) : (
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada notifikasi terkirim</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id_event}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50"
                >
                  <div className="w-8 h-8 bg-brand-green-light rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-brand-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">{event.judul}</p>
                      <span className="text-[10px] text-slate-400">{event.id_event}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{event.deskripsi}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-400">
                        Target: {event.target_gelombang}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-green-light text-brand-green-dark">
                        {event.status_kirim}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
