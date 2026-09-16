const API_URL = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'spmb.session-token'
const USER_KEY = 'spmb.session'

const DEFAULT_TIMEOUT_MS = 30_000
const HEAVY_TIMEOUT_MS = 120_000
const RETRY_BACKOFF_MS = 800
const MAX_ATTEMPTS = 2

const HEAVY_ACTIONS = new Set(['upload', 'register', 'adminRegisterSiswa', 'auth'])
// Aksi non-idempoten / sensitif kuota: JANGAN di-retry otomatis.
// auth & upload masuk sini agar 1 klik = 1 hit (mencegah percepatan rate-limit).
const NO_RETRY_ACTIONS = new Set(['register', 'adminRegisterSiswa', 'auth', 'upload'])

type FailureKind = 'network' | 'timeout' | 'http'

interface RequestFailure extends Error {
  kind?: FailureKind
  statusCode?: number
  code?: string
  retryAfterSec?: number
}

export const _internals = {
  backoff: (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  authRedirect: (url: string) => {
    window.location.href = url
  },
}

function makeFailure(message: string, kind?: FailureKind, statusCode?: number, code?: string, retryAfterSec?: number): RequestFailure {
  const err = new Error(message) as RequestFailure
  if (kind) err.kind = kind
  if (statusCode !== undefined) err.statusCode = statusCode
  if (code) err.code = code
  if (retryAfterSec !== undefined) err.retryAfterSec = retryAfterSec
  return err
}

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const failure = err as RequestFailure
  if (failure.kind === 'network') return true
  if (failure.kind === 'timeout') return false
  // 404 TIDAK di-retry: hampir selalu URL basi / deployment non-aktif, bukan transient.
  // Retry hanya untuk 429 (rate-limit) dan 5xx.
  const status = failure.statusCode
  return status === 429 || (typeof status === 'number' && status >= 500 && status < 600)
}

interface ApiResponse {
  status: 'ok' | 'error'
  message?: string
  code?: string
  scope?: string
  retryAfterSec?: number
  serverBuild?: string
  data?: unknown
  [key: string]: unknown
}

export function getRetryAfterSec(err: unknown): number {
  if (err instanceof Error) {
    const r = (err as RequestFailure).retryAfterSec
    if (typeof r === 'number' && r > 0) return Math.min(r, 3600)
  }
  const m = /dalam (\d+) detik/i.exec(err instanceof Error ? err.message : String(err || ''))
  if (m) return Math.min(Number(m[1]), 3600)
  return 0
}

export function getSessionToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setSessionToken(token: string): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    /* noop */
  }
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* noop */
  }
}

export function getStoredUser<T extends { email?: string }>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as T
    return parsed && parsed.email ? parsed : null
  } catch {
    return null
  }
}

export function writeStoredUser(user: unknown): void {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  } catch {
    /* noop */
  }
}

const FRIENDLY_ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/sudah terdaftar/i, 'Email ini sudah terdaftar. Silakan login atau hubungi admin.'],
  [/sesi tidak valid|sesi berakhir/i, 'Sesi Anda berakhir. Silakan login kembali.'],
  [/token google/i, 'Verifikasi Google gagal. Silakan coba login ulang.'],
  [/akses ditolak/i, 'Anda tidak memiliki izin untuk melakukan aksi ini.'],
  [/terlalu banyak.*pendaftaran/i, 'Terlalu banyak percobaan pendaftaran. Tunggu hitungan mundur lalu coba lagi.'],
  [/terlalu banyak/i, 'Terlalu banyak percobaan login. Tunggu hitungan mundur lalu coba lagi.'],
  [/UPLOAD_OK_SAVE_FAILED|gagal disimpan ke data/i, 'Foto berhasil diunggah tetapi gagal disimpan ke data. Tekan Simpan Ulang.'],
  [/FILE_TOO_LARGE|maksimal 10MB/i, 'File terlalu besar. Gunakan foto lain atau tunggu kompresi selesai.'],
  [/UNKNOWN_ACTION|frontend lebih baru/i, 'Aplikasi backend belum diperbarui setelah deploy. Hubungi admin untuk redeploy.'],
  [/HTTP 404/i, 'Layanan backend tidak tersedia (404). Kemungkinan URL backend basi setelah deploy — hubungi admin.'],
  [/HTTP 429/i, 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.'],
  [/HTTP 5\d\d/i, 'Server sedang sibuk. Tunggu sebentar lalu coba lagi.'],
  [/failed to fetch|load failed|networkerror|network error/i, 'Koneksi bermasalah. Periksa internet Anda dan coba lagi.'],
]

export function formatRetryCountdown(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// URL gambar Drive yang stabil untuk <img> (endpoint uc?export=view tidak stabil).
export function driveImageUrl(fileIdOrUrl: string, size = 800): string {
  if (!fileIdOrUrl) return ''
  const m = /[?&]id=([^&]+)/.exec(fileIdOrUrl) || /\/d\/([^/]+)/.exec(fileIdOrUrl)
  const id = m ? m[1] : fileIdOrUrl
  if (/^https?:\/\//.test(fileIdOrUrl) && !m) return fileIdOrUrl
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${size}`
}

export async function checkBackendHealth(): Promise<{ ok: boolean; serverBuild?: string }> {
  if (!API_URL) return { ok: false }
  try {
    const res = await fetch(API_URL, { method: 'GET' })
    if (!res.ok) return { ok: false }
    const body = (await res.json()) as { status?: string; serverBuild?: string }
    return { ok: body.status === 'ok', serverBuild: body.serverBuild }
  } catch {
    return { ok: false }
  }
}

export function getFriendlyAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || '')
  for (const [pattern, friendly] of FRIENDLY_ERROR_PATTERNS) {
    if (pattern.test(raw)) return friendly
  }
  return raw || 'Terjadi kesalahan. Silakan coba lagi.'
}

function getTimeoutMs(action: string): number {
  return HEAVY_ACTIONS.has(action) ? HEAVY_TIMEOUT_MS : DEFAULT_TIMEOUT_MS
}

async function performRequest(action: string, body: Record<string, unknown>): Promise<ApiResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), getTimeoutMs(action))

  try {
    let response: Response
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch {
      if (controller.signal.aborted) {
        throw makeFailure('Koneksi ke server habis waktu. Silakan periksa internet dan coba lagi.', 'timeout')
      }
      throw makeFailure('Koneksi bermasalah. Periksa internet Anda dan coba lagi.', 'network')
    }

    if (!response.ok) {
      throw makeFailure(`HTTP ${response.status}: ${response.statusText}`, 'http', response.status)
    }

    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

async function request(action: string, payload: Record<string, unknown> = {}): Promise<ApiResponse> {
  if (!API_URL) {
    throw new Error('Konfigurasi API belum diatur (VITE_API_URL). Hubungi administrator.')
  }

  const token = getSessionToken()
  const body: Record<string, unknown> = { action, ...payload }
  if (token) body.token = token

  const maxAttempts = NO_RETRY_ACTIONS.has(action) ? 1 : MAX_ATTEMPTS
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await performRequest(action, body)

      if (result.status === 'error') {
        if (result.code === 'AUTH_REQUIRED') {
          clearSessionToken()
          writeStoredUser(null)
          _internals.authRedirect('/?session=expired')
        }
        throw makeFailure(result.message || 'Unknown error', undefined, undefined, result.code, typeof result.retryAfterSec === 'number' ? result.retryAfterSec : undefined)
      }

      return result
    } catch (err) {
      lastError = err
      if (attempt >= maxAttempts || !isRetryable(err)) break
      await _internals.backoff(RETRY_BACKOFF_MS)
    }
  }

  throw lastError
}

export const api = {
  upload: (fileName: string, mimeType: string, fileData: string) =>
    request('upload', { fileName, mimeType, fileData }),

  auth: {
    login: (email: string, nama?: string, fotoUrl?: string, idToken?: string) => {
      const payload: Record<string, unknown> = { email }
      if (nama) payload.nama = nama
      if (fotoUrl) payload.fotoUrl = fotoUrl
      if (idToken) payload.idToken = idToken
      return request('auth', payload)
    },

    register: (
      email: string,
      nama: string,
      fotoUrl?: string,
      idToken?: string,
      opts?: { registerAs?: 'guru_smp'; noTelp?: string; asalSekolah?: string }
    ) => {
      const payload: Record<string, unknown> = { email, nama }
      if (fotoUrl) payload.fotoUrl = fotoUrl
      if (idToken) payload.idToken = idToken
      if (opts?.registerAs) payload.registerAs = opts.registerAs
      if (opts?.noTelp) payload.no_telp = opts.noTelp
      if (opts?.asalSekolah) payload.asal_sekolah = opts.asalSekolah
      return request('register', payload)
    },
  },

  siswa: {
    get: (email: string) =>
      request('getSiswa', { email }),

    getAll: () =>
      request('getSiswa'),

    update: (email: string, data: Record<string, unknown>) =>
      request('updateSiswa', { email, ...data }),

    create: (data: Record<string, unknown>) =>
      request('adminRegisterSiswa', data),

    remove: (idPendaftaran: string, email?: string) =>
      request('deleteSiswa', { id_pendaftaran: idPendaftaran, email: email || '' }),

    deleteAll: (confirm: string) =>
      request('deleteAllSiswa', { confirm }),
  },

  referral: {
    getStats: () =>
      request('getReferralStats'),

    options: () =>
      request('getReferralOptions'),
  },

  gelombang: {
    get: () =>
      request('getGelombang'),

    update: (data: Record<string, unknown>) =>
      request('updateGelombang', data),

    delete: (gelombang: string) =>
      request('deleteGelombang', { gelombang }),
  },

  config: {
    get: () =>
      request('getConfig'),

    update: (key: string, value: string) =>
      request('updateConfig', { key, value }),
  },

  broadcast: {
    getEvents: () =>
      request('getEvents'),

    send: (judul: string, deskripsi: string, target: string, gambarUrl?: string, tanggalPelaksanaan?: string, waktuPelaksanaan?: string, tempatPelaksanaan?: string) =>
      request('sendBroadcast', { judul, deskripsi, target, gambar_url: gambarUrl || '', tanggal_pelaksanaan: tanggalPelaksanaan || '', waktu_pelaksanaan: waktuPelaksanaan || '', tempat_pelaksanaan: tempatPelaksanaan || '' }),

    delete: (idEvent: string) =>
      request('deleteEvent', { id_event: idEvent }),

    update: (idEvent: string, data: Record<string, unknown>) =>
      request('updateEvent', { id_event: idEvent, ...data }),

    getEngagement: (idEvent: string, email?: string) =>
      request('getEngagement', { id_event: idEvent, email: email || '' }),

    toggleLike: (idEvent: string, email: string) =>
      request('toggleLike', { id_event: idEvent, email }),

    addKomentar: (idEvent: string, email: string, nama: string, teks: string) =>
      request('addKomentar', { id_event: idEvent, email, nama, teks }),

    sendReminder: (idEvent: string, email: string, nama: string) =>
      request('sendReminder', { id_event: idEvent, email, nama }),
  },

  admin: {
    list: () =>
      request('getAdminList'),

    guruList: () =>
      request('getGuruList'),

    deleteGuru: (email: string) =>
      request('deleteGuru', { email }),

    add: (email: string, nama: string, role: string, no_telp?: string) =>
      request('addAdmin', { email, nama, role, no_telp }),

    update: (email: string, data: Record<string, unknown>) =>
      request('updateAdmin', { email, ...data }),

    delete: (email: string) =>
      request('deleteAdmin', { email }),
  },

  mpls: {
    lookupById: (idPendaftaran: string) =>
      request('mplsLookupById', { id_pendaftaran: idPendaftaran }),

    addKehadiran: (idPendaftaran: string, scanOleh: string) =>
      request('mplsAddKehadiran', { id_pendaftaran: idPendaftaran, scan_oleh: scanOleh }),

    getKehadiran: (tanggal?: string) =>
      request('mplsGetKehadiran', { tanggal: tanggal || '' }),

    addIzin: (data: Record<string, unknown>) =>
      request('mplsAddIzin', data),

    getIzin: (tanggal?: string) =>
      request('mplsGetIzin', { tanggal: tanggal || '' }),

    deleteIzin: (idIzin: string) =>
      request('mplsDeleteIzin', { id_izin: idIzin }),
  },

  timeline: {
    get: () =>
      request('getTimeline'),

    add: (data: Record<string, unknown>) =>
      request('addTimeline', data),

    update: (idTimeline: string, data: Record<string, unknown>) =>
      request('updateTimeline', { id_timeline: idTimeline, ...data }),

    delete: (idTimeline: string) =>
      request('deleteTimeline', { id_timeline: idTimeline }),
  },
}
