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

    send: (judul: string, deskripsi: string, target: string) =>
      request('sendBroadcast', { judul, deskripsi, target }),
  },

  upload: {
    file: (fileName: string, fileData: string, mimeType: string) =>
      request('upload', { fileName, fileData, mimeType }),
  },

  admin: {
    getAll: () =>
      request('getAdmins'),

    add: (email: string, nama: string, role: string, no_telepon: string) =>
      request('addAdmin', { email, nama, role, no_telepon }),

    update: (email: string, data: Record<string, unknown>) =>
      request('updateAdmin', { email, ...data }),

    remove: (email: string) =>
      request('deleteAdmin', { email }),
  },
}
