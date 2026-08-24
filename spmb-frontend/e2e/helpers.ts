import type { Page } from '@playwright/test'

export const MOCK_EMAIL = 'calonsiswa@gmail.com'

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
}

type BackendResponses = Record<string, unknown>

export async function mockBackend(page: Page, responses: BackendResponses = {}) {
  await page.route('https://openidconnect.googleapis.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify({ email: MOCK_EMAIL, name: 'Calon Siswa', picture: '' }),
    }),
  )

  await page.route(/script\.google\.com/, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS })
      return
    }
    let action = ''
    try {
      action = (JSON.parse(route.request().postData() ?? '{}') as { action?: string }).action ?? ''
    } catch {
      /* body bukan JSON */
    }
    const body = responses[action] ?? { status: 'ok', data: [] }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify(body),
    })
  })

  await page.route(/accounts\.google\.com/, (route) => route.abort())
}

export async function stubGoogleSignIn(page: Page) {  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>
    w.google = {
      accounts: {
        oauth2: {
          initTokenClient: (config: { callback: (r: { access_token: string }) => void }) => ({
            requestAccessToken: () => config.callback({ access_token: 'e2e-fake-token' }),
          }),
        },
      },
    }
  })
}

export function seedSession(page: Page, role: string, email = MOCK_EMAIL) {
  return page.addInitScript(
    ({ role, email }) => {
      localStorage.setItem('spmb.session-token', 'e2e-session-token')
      localStorage.setItem(
        'spmb.session',
        JSON.stringify({ email, nama: 'Pengguna E2E', role, fotoUrl: '', asal_sekolah: '' }),
      )
    },
    { role, email },
  )
}
