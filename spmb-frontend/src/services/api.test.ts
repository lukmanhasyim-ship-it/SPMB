import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getFriendlyAuthError } from './api'

const TEST_API_URL = 'https://script.google.com/macros/s/TEST/exec'
const TOKEN_KEY = 'spmb.session-token'
const USER_KEY = 'spmb.session'

type ApiModule = typeof import('./api')

async function loadApi(): Promise<ApiModule> {
  vi.resetModules()
  return await import('./api')
}

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => body,
  }
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('getFriendlyAuthError', () => {
  it.each([
    ['Email sudah terdaftar', 'sudah terdaftar'],
    ['Sesi tidak valid. Silakan login ulang.', 'Sesi Anda berakhir'],
    ['Token Google wajib diisi', 'Verifikasi Google gagal'],
    ['Akses ditolak', 'tidak memiliki izin'],
    ['Terlalu banyak percobaan', 'Terlalu banyak percobaan'],
    ['Failed to fetch', 'Koneksi bermasalah'],
  ])('memetakan "%s" ke pesan ramah', (raw, expectedFragment) => {
    expect(getFriendlyAuthError(new Error(raw))).toContain(expectedFragment)
  })

  it('mengembalikan pesan asli bila tidak ada pola yang cocok', () => {
    expect(getFriendlyAuthError(new Error('Kesalahan aneh'))).toBe('Kesalahan aneh')
  })

  it('memakai fallback bila error kosong', () => {
    expect(getFriendlyAuthError('')).toBe('Terjadi kesalahan. Silakan coba lagi.')
  })
})

describe('request()', () => {
  it('melempar pesan konfigurasi jelas saat VITE_API_URL kosong', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const api = await loadApi()

    await expect(api.api.siswa.get('a@gmail.com')).rejects.toThrow(
      'Konfigurasi API belum diatur (VITE_API_URL)',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('menyertakan action dan session token pada body request', async () => {
    vi.stubEnv('VITE_API_URL', TEST_API_URL)
    localStorage.setItem(TOKEN_KEY, 'secret-token')
    const fetchMock = vi.fn(async () => jsonResponse({ status: 'ok' }))
    vi.stubGlobal('fetch', fetchMock)

    const api = await loadApi()
    await api.api.siswa.get('a@gmail.com')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const body = JSON.parse(String(init.body))
    expect(body.action).toBe('getSiswa')
    expect(body.email).toBe('a@gmail.com')
    expect(body.token).toBe('secret-token')
  })

  it('membersihkan sesi dan mengarahkan ke /?session=expired saat AUTH_REQUIRED', async () => {
    vi.stubEnv('VITE_API_URL', TEST_API_URL)
    localStorage.setItem(TOKEN_KEY, 'tok')
    localStorage.setItem(USER_KEY, JSON.stringify({ email: 'a@gmail.com', role: 'siswa' }))
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ status: 'error', code: 'AUTH_REQUIRED', message: 'Sesi habis' })))

    const api = await loadApi()
    const redirectSpy = vi.fn()
    api._internals.authRedirect = redirectSpy

    await expect(api.api.siswa.get('a@gmail.com')).rejects.toThrow('Sesi habis')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
    expect(redirectSpy).toHaveBeenCalledWith('/?session=expired')
  })

  it('timeout menghasilkan pesan ramah dan tidak di-retry', async () => {
    vi.useFakeTimers()
    vi.stubEnv('VITE_API_URL', TEST_API_URL)
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted')
            err.name = 'AbortError'
            reject(err)
          })
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const api = await loadApi()
    const pending = api.api.siswa.get('a@gmail.com').catch((e: Error) => e)
    await vi.advanceTimersByTimeAsync(30_000)
    const error = (await pending) as Error

    expect(error.message).toContain('habis waktu')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('me-retry aksi baca saat network error lalu berhasil', async () => {
    vi.stubEnv('VITE_API_URL', TEST_API_URL)
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse({ status: 'ok', data: {} }))
    vi.stubGlobal('fetch', fetchMock)

    const api = await loadApi()
    api._internals.backoff = () => Promise.resolve()

    const result = await api.api.siswa.getAll()

    expect(result.status).toBe('ok')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('me-retry pada HTTP 500 lalu gagal dengan pesan HTTP', async () => {
    vi.stubEnv('VITE_API_URL', TEST_API_URL)
    const serverError = { ok: false, status: 500, statusText: 'Internal Server Error' }
    const fetchMock = vi.fn().mockResolvedValue(serverError)
    vi.stubGlobal('fetch', fetchMock)

    const api = await loadApi()
    api._internals.backoff = () => Promise.resolve()

    await expect(api.api.gelombang.get()).rejects.toThrow('HTTP 500')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('tidak me-retry pada HTTP 400', async () => {
    vi.stubEnv('VITE_API_URL', TEST_API_URL)
    const clientError = { ok: false, status: 400, statusText: 'Bad Request' }
    const fetchMock = vi.fn().mockResolvedValue(clientError)
    vi.stubGlobal('fetch', fetchMock)

    const api = await loadApi()

    await expect(api.api.gelombang.get()).rejects.toThrow('HTTP 400')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('tidak me-retry aksi non-idempoten (register)', async () => {
    vi.stubEnv('VITE_API_URL', TEST_API_URL)
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)

    const api = await loadApi()

    await expect(api.api.auth.register('a@gmail.com', 'Budi', undefined, 'tok')).rejects.toThrow(
      'Koneksi bermasalah',
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
