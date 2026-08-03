const API_URL = import.meta.env.VITE_API_URL || ''

interface ApiResponse {
  status: 'ok' | 'error'
  message?: string
  data?: unknown
  [key: string]: unknown
}

async function request(action: string, payload: Record<string, unknown> = {}): Promise<ApiResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...payload }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const result: ApiResponse = await response.json()

  if (result.status === 'error') {
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

    register: (email: string, nama: string, fotoUrl?: string) =>
      request('register', { email, nama, fotoUrl }),
  },

  siswa: {
    get: (email: string) =>
      request('getSiswa', { email }),

    getAll: () =>
      request('getSiswa'),

    update: (email: string, data: Record<string, unknown>) =>
      request('updateSiswa', { email, ...data }),
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
  },
}
