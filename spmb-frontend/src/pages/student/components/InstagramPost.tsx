import React, { useState, useRef, useEffect } from 'react'
import { Heart, MessageCircle, Calendar, Clock, MapPin, Check, CalendarPlus, Smile, Loader2 } from 'lucide-react'
import { formatWIBShort } from '../../../utils/dateUtils'
import { api } from '../../../services/api'

export interface EventType {
  id_event: string
  target_gelombang: string
  judul: string
  deskripsi: string
  gambar_url: string
  tanggal_pelaksanaan: string
  waktu_pelaksanaan: string
  tempat_pelaksanaan: string
  created_at: string
}

interface InstagramPostProps {
  event: EventType
  studentName?: string
  gelombangSiswa?: string
  userEmail?: string
}

interface CommentType {
  email: string
  nama: string
  teks: string
  created_at?: string
}

function buildCalendarUrl(opts: {
  title: string
  date: string
  time: string
  location?: string
  details?: string
  endDate?: string
  endTime?: string
}): string {
  if (!opts.date) return '#'
  const dateStr = opts.date.replace(/-/g, '')
  const startTime = (opts.time || '07:00').replace(':', '') + '00'
  const startDate = `${dateStr}T${startTime}`
  let endDateStr: string
  if (opts.endDate && opts.endTime) {
    endDateStr = `${opts.endDate.replace(/-/g, '')}T${opts.endTime.replace(':', '')}00`
  } else {
    const endHour = parseInt((opts.time || '07:00').split(':')[0], 10) + 1
    endDateStr = `${dateStr}T${String(endHour).padStart(2, '0')}${(opts.time || '07:00').split(':')[1]}00`
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    dates: `${startDate}/${endDateStr}`,
    ctz: 'Asia/Jakarta',
  })
  if (opts.location) params.set('location', opts.location)
  if (opts.details) params.set('details', opts.details)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function getRelativeTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return 'Baru saja'
  try {
    const elapsed = Date.now() - new Date(dateStr).getTime()
    const secs = Math.floor(elapsed / 1000)
    if (secs < 60) return 'Baru saja'
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins} menit yang lalu`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} jam yang lalu`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} hari yang lalu`
    return formatWIBShort(dateStr)
  } catch {
    return 'Beberapa waktu lalu'
  }
}

export default function InstagramPost({ event, studentName, userEmail }: InstagramPostProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showHeartAnim, setShowHeartAnim] = useState(false)
  const [showHeartComment, setShowHeartComment] = useState<Record<number, boolean>>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [reminding, setReminding] = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)

  const handleUserClick = (username: string) => {
    setToastMessage(`@${username} sedang offline`)
    setTimeout(() => setToastMessage(null), 2000)
  }

  const getSeedComments = (): CommentType[] => {
    const lowerJ = event.judul.toLowerCase()
    if (lowerJ.includes('tes') || lowerJ.includes('seleksi') || lowerJ.includes('ujian')) {
      return [
        { email: '', nama: 'rahma.dhani', teks: 'Kak, lokasi tesnya di ruangan mana ya?' },
        { email: '', nama: 'panitia_spmb', teks: 'Lokasi ujian tertera di kartu ujian atau papan pengumuman di lobi utama dek.' },
        { email: '', nama: 'rizki_permadi', teks: 'Semoga lulus seleksi masuk gelombang ini! 🤲🔥' },
      ]
    }
    if (lowerJ.includes('berkas') || lowerJ.includes('daftar ulang') || lowerJ.includes('administrasi')) {
      return [
        { email: '', nama: 'melati_lestari', teks: 'Uang pendaftarannya bisa dicicil kak?' },
        { email: '', nama: 'panitia_spmb', teks: 'Silakan hubungi bagian administrasi keuangan di sekolah untuk detail cicilan ya.' },
        { email: '', nama: 'budi.prasetyo', teks: 'Persyaratan berkas asli wajib dibawa?' },
      ]
    }
    return [
      { email: '', nama: 'siswabaru_2026', teks: 'Infomasi yang sangat membantu, terimakasih min! 👍' },
      { email: '', nama: 'panitia_spmb', teks: 'Sama-sama dek. Bila ada kendala silakan hubungi kami di WA.' },
    ]
  }

  const [comments, setComments] = useState<CommentType[]>(getSeedComments)

  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    api.broadcast
      .getEngagement(event.id_event, userEmail || '')
      .then((res) => {
        if (cancelled) return
        if (res.status === 'ok') {
          const d = res.data as { like_count: number; is_liked: boolean; comments: CommentType[] }
          setLikeCount(typeof d.like_count === 'number' ? d.like_count : 0)
          setIsLiked(Boolean(d.is_liked))
          if (Array.isArray(d.comments)) setComments(d.comments)
        }
      })
      .catch(() => { })
    return () => { cancelled = true }
  }, [event.id_event, userEmail])

  const lastTap = useRef<number>(0)

  const applyLike = (nextLiked: boolean) => {
    const wasLiked = isLiked
    if (nextLiked === wasLiked) return
    const delta = nextLiked ? 1 : -1
    setIsLiked(nextLiked)
    setLikeCount((prev) => Math.max(0, prev + delta))

    if (!userEmail) return
    api.broadcast
      .toggleLike(event.id_event, userEmail)
      .then((res) => {
        if (res.status === 'ok') {
          const d = res.data as { like_count: number; is_liked: boolean }
          setLikeCount(d.like_count)
          setIsLiked(d.is_liked)
        }
      })
      .catch(() => {
        setIsLiked(wasLiked)
        setLikeCount((prev) => Math.max(0, prev - delta))
      })
  }

  const handleMediaClick = () => {
    const now = Date.now()
    const DOUBLE_PRESS_DELAY = 300
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      applyLike(true)
      setShowHeartAnim(true)
      setTimeout(() => setShowHeartAnim(false), 800)
    }
    lastTap.current = now
  }

  const toggleLike = () => {
    applyLike(!isLiked)
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const teks = newComment.trim()
    const formattedUsername = studentName
      ? studentName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15)
      : 'calon_siswa'

    setComments((prev) => [...prev, { email: userEmail || '', nama: formattedUsername, teks }])
    setNewComment('')

    if (!userEmail) return

    try {
      const res = await api.broadcast.addKomentar(event.id_event, userEmail, studentName || '', teks)
      if (res.status === 'ok') {
        setComments(res.data as CommentType[])
      }
    } catch {
      setToastMessage('Komentar tersimpan, namun belum tersinkron dengan server')
      setTimeout(() => setToastMessage(null), 2500)
    }
  }

  const toggleHeartComment = (index: number) => {
    setShowHeartComment(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const focusCommentInput = () => {
    if (commentInputRef.current) {
      commentInputRef.current.focus()
    }
  }

  // Generate calendar link variables
  const effectiveDate = event.tanggal_pelaksanaan || (event.created_at ? String(event.created_at).substring(0, 10) : '')
  const reminderUrl = effectiveDate
    ? buildCalendarUrl({
      title: `[Pengingat] ${event.judul}`,
      date: effectiveDate,
      time: '07:00',
      location: event.tempat_pelaksanaan || undefined,
      details: `Hai, jangan lupa besok ada kegiatan: ${event.judul}. Jadi Persiapkan dirimu ya!! kami tunggu di sekolah.`,
      endDate: effectiveDate,
      endTime: '07:30',
    })
    : '#'

  const addCalendarUrl = effectiveDate
    ? buildCalendarUrl({
      title: event.judul,
      date: effectiveDate,
      time: event.waktu_pelaksanaan || '08:00',
      location: event.tempat_pelaksanaan || undefined,
      details: event.deskripsi,
    })
    : '#'

  const handleRemind = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (reminding) return
    setReminding(true)

    if (reminderUrl && reminderUrl !== '#') {
      window.open(reminderUrl, '_blank', 'noopener,noreferrer')
    }

    if (userEmail) {
      try {
        const res = await api.broadcast.sendReminder(event.id_event, userEmail, studentName || '')
        if (res.status === 'ok') {
          setToastMessage('Pengingat berhasil dibuat! Cek Google Calendar Anda')
          setTimeout(() => setToastMessage(null), 2500)
        }
      } catch {
        setToastMessage('Buka Google Calendar untuk menambah pengingat')
        setTimeout(() => setToastMessage(null), 2000)
      }
    } else {
      setToastMessage('Buka Google Calendar untuk menambah pengingat')
      setTimeout(() => setToastMessage(null), 2000)
    }

    setReminding(false)
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-w-lg mx-auto relative">
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg border border-slate-700/50 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-brand-orange stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CSS Animation Injector */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes instagramHeart {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          15% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.95; }
          30% { transform: translate(-50%, -50%) scale(0.9); opacity: 1; }
          80% { transform: translate(-50%, -50%) scale(0.9); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        }
        .instagram-heart-pop {
          animation: instagramHeart 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .instagram-ring {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }
      `}} />

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar with IG Story Ring */}
          <div className="w-9 h-9 rounded-full instagram-ring p-[2px] flex-shrink-0">
            <div className="w-full h-full bg-white rounded-full p-[1.5px] flex items-center justify-center overflow-hidden">
              <img src="/logo.svg" alt="School Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span
                onClick={() => handleUserClick('panitia_spmb')}
                className="text-xs font-bold text-slate-800 hover:underline cursor-pointer"
              >
                panitia_spmb
              </span>
              <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold" title="Akun Resmi Terverifikasi">
                <Check className="w-2.5 h-2.5 stroke-[4]" />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 leading-none">
              {event.tempat_pelaksanaan || 'SMKS AL AZHAR SEMPU'} • Resmi
            </span>
          </div>
        </div>
      </div>

      {/* Visual Content Block */}
      <div
        className="w-full relative cursor-pointer select-none"
        onClick={handleMediaClick}
      >
        {event.gambar_url ? (
          <div className="w-full aspect-[3/4] bg-slate-900 flex items-center justify-center overflow-hidden">
            <img
              src={event.gambar_url}
              alt={event.judul}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          /* Premium Fallback Gradient Post */
          <div className="w-full aspect-[3/4] bg-gradient-to-br from-brand-green via-teal-900 to-slate-900 flex flex-col justify-between p-8 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-15%] left-[-15%] w-80 h-80 bg-brand-orange-light/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header tag */}
            <div className="flex justify-between items-center text-[10px] text-[#e8f4ef] font-semibold tracking-wider bg-white/10 self-start px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              📢 INFO PENDAFTARAN
            </div>

            {/* Title */}
            <div className="my-auto text-center px-4">
              <h2 className="text-xl md:text-2xl font-extrabold text-white leading-snug drop-shadow-md tracking-tight">
                {event.judul}
              </h2>
              <div className="w-12 h-1 bg-brand-orange mx-auto mt-4 rounded-full" />
            </div>

            {/* Footer details */}
            <div className="flex justify-between items-center text-[10px] text-white/50 border-t border-white/10 pt-4 mt-auto">
              <span>PANITIA SPMB</span>
            </div>
          </div>
        )}

        {/* Double-tap Floating heart overlay */}
        {showHeartAnim && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
            <Heart className="w-20 h-20 text-white fill-white instagram-heart-pop" />
          </div>
        )}

        {/* Sponsored action button (Instagram Ad CTA style) */}
        {event.tanggal_pelaksanaan && (
          <a
            href={addCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#007643] hover:bg-[#005e35] text-white flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-colors border-t border-slate-100 z-10 relative"
            onClick={(e) => e.stopPropagation()} // Stop triggering double click
          >
            <span className="uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Tambah Agenda ke Kalender
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full transition-transform hover:translate-x-0.5">
              Klik Di Sini →
            </span>
          </a>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleLike}
            className={`transition-transform duration-200 active:scale-95 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-slate-700 hover:text-slate-800'}`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 stroke-red-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={focusCommentInput}
            className="text-slate-700 hover:text-slate-800 transition-transform duration-200 active:scale-95"
            title="Komentar"
          >
            <MessageCircle className="w-6 h-6" />
          </button>


          <button
            type="button"
            onClick={handleRemind}
            className="text-slate-700 hover:text-slate-850 transition-transform duration-200 active:scale-95"
            title="Ingatkan via Google Calendar"
          >
            {reminding ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : <CalendarPlus className="w-6 h-6 hover:text-blue-600" />}
          </button>
        </div>
      </div>

      {/* Interactions View */}
      <div className="px-3.5 pb-2 text-xs font-semibold text-slate-800">
        {likeCount.toLocaleString('id-ID')} suka
      </div>

      {/* Caption Section */}
      <div className="px-3.5 pb-2 text-xs text-slate-800 leading-relaxed">
        <span
          onClick={() => handleUserClick('panitia_spmb')}
          className="font-bold text-slate-800 mr-2 cursor-pointer hover:underline"
        >
          panitia_spmb
        </span>
        <span>
          {isExpanded ? (
            <span className="whitespace-pre-line">{event.deskripsi}</span>
          ) : (
            <span>
              {event.deskripsi.length > 120
                ? `${event.deskripsi.substring(0, 120)}...`
                : event.deskripsi}
            </span>
          )}
        </span>
        {event.deskripsi.length > 120 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-500 hover:text-slate-750 font-medium ml-1.5 focus:outline-none"
          >
            {isExpanded ? 'Lebih sedikit' : 'selengkapnya'}
          </button>
        )}
      </div>

      {/* Structured Details Box (Date, Time, Location) if available */}
      {(event.tanggal_pelaksanaan || event.waktu_pelaksanaan || event.tempat_pelaksanaan) && (
        <div className="mx-3.5 mb-3 bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1.5 text-xs text-slate-700">
          <p className="font-bold text-slate-800 mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
            📌 Detail Pelaksanaan Acara:
          </p>
          {event.tanggal_pelaksanaan && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-brand-green" />
              <span>Tanggal: <span className="font-semibold text-slate-800">{formatWIBShort(event.tanggal_pelaksanaan)}</span></span>
            </div>
          )}
          {event.waktu_pelaksanaan && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-brand-green" />
              <span>Waktu: <span className="font-semibold text-slate-800">{event.waktu_pelaksanaan} WIB</span></span>
            </div>
          )}
          {event.tempat_pelaksanaan && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-brand-green" />
              <span>Tempat: <span className="font-semibold text-slate-800">{event.tempat_pelaksanaan}</span></span>
            </div>
          )}
        </div>
      )}

      {/* Comments section */}
      <div className="px-3.5 pb-2 text-[11px] space-y-2 border-t border-slate-50 pt-2.5">
        <p className="text-slate-500 font-medium cursor-pointer hover:underline">
          Lihat semua {comments.length} komentar
        </p>
        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
          {comments.map((cmt, idx) => (
            <div key={idx} className="flex justify-between items-start group">
              <div className="leading-relaxed">
                <span
                  onClick={() => handleUserClick(cmt.nama || cmt.email.split('@')[0])}
                  className="font-bold text-slate-800 mr-2 hover:underline cursor-pointer"
                >
                  {cmt.nama || (cmt.email ? cmt.email.split('@')[0] : 'pengguna')}
                </span>
                <span className="text-slate-600">{cmt.teks}</span>
              </div>
              <button
                onClick={() => toggleHeartComment(idx)}
                className={`flex-shrink-0 text-slate-400 opacity-30 group-hover:opacity-100 hover:opacity-100 transition-opacity p-0.5 hover:text-red-500 ${showHeartComment[idx] ? 'text-red-500 opacity-100 !important' : ''}`}
              >
                <Heart className={`w-3 h-3 ${showHeartComment[idx] ? 'fill-red-500 stroke-red-500' : ''}`} />
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-1.5">
          {getRelativeTime(event.created_at)}
        </p>
      </div>

      {/* Add Comment Box */}
      <form
        onSubmit={handleAddComment}
        className="flex items-center justify-between border-t border-slate-100 px-3.5 py-3 relative"
      >
        {showEmojiPicker && (
          <div className="absolute bottom-12 left-4 bg-white/95 backdrop-blur-md border border-slate-200 p-2 rounded-lg shadow-lg flex gap-2 z-20">
            {['❤️', '🔥', '👏', '👍', '😂', '🙌', '😍'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setNewComment((prev) => prev + emoji)
                  setShowEmojiPicker(false)
                  commentInputRef.current?.focus()
                }}
                className="text-lg hover:scale-125 transition-transform duration-100 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 flex-grow pr-2">
          <Smile
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
          />
          <input
            ref={commentInputRef}
            type="text"
            placeholder="Tambahkan komentar..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full text-xs placeholder:text-slate-400 focus:outline-none bg-transparent text-slate-800"
          />
        </div>
        <button
          type="submit"
          disabled={!newComment.trim()}
          className={`text-xs font-bold transition-colors ${newComment.trim()
              ? 'text-sky-500 hover:text-sky-600 cursor-pointer'
              : 'text-sky-200 cursor-default'
            }`}
        >
          Kirim
        </button>
      </form>
    </div>
  )
}
