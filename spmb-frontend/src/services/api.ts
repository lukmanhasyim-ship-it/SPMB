const API_URL = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'spmb.session-token'
const USER_KEY = 'spmb.session'

interface ApiResponse {
  status: 'ok' | 'error'
  message?: string
  code?: string
  data?: unknown
  [key: string]: unknown
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
  [/terlalu banyak/i, 'Terlalu banyak percobaan. Silakan coba lagi nanti.'],
]

export function getFriendlyAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || '')
  for (const [pattern, friendly] of FRIENDLY_ERROR_PATTERNS) {
    if (pattern.test(raw)) return friendly
  }
  return raw || 'Terjadi kesalahan. Silakan coba lagi.'
}

async function request(action: string, payload: Record<string, unknown> = {}): Promise<ApiResponse> {
  if (!API_URL) {
    throw new Error('Konfigurasi API belum diatur (VITE_API_URL). Hubungi administrator.')
  }

  const token = getSessionToken()
  const body: Record<string, unknown> = { action, ...payload }
  if (token) body.token = token

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const result: ApiResponse = await response.json()

  if (result.status === 'error') {
    if (result.code === 'AUTH_REQUIRED') {
      clearSessionToken()
      writeStoredUser(null)
      window.location.href = '/?session=expired'
    }
    throw new Error(result.message || 'Unknown error')
  }

  return result
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
