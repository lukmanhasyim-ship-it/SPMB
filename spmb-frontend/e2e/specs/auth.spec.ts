import { test, expect } from '@playwright/test'
import { mockBackend, stubGoogleSignIn, seedSession, MOCK_EMAIL } from './helpers'

test.describe('Alur autentikasi', () => {
  test('pengguna baru diarahkan ke register dengan data terisi', async ({ page }) => {
    await stubGoogleSignIn(page)
    await mockBackend(page, {
      auth: {
        status: 'ok',
        role: 'new',
        user: { email: MOCK_EMAIL, nama: 'Calon Siswa', fotoUrl: '' },
        sessionToken: 'e2e-session-token',
      },
    })

    await page.goto('/')
    await page.getByRole('button', { name: /masuk dengan google/i }).click()

    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByPlaceholder('contoh@gmail.com')).toHaveValue(MOCK_EMAIL)
  })

  test('sesi tersimpan dipulihkan untuk dashboard siswa', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'siswa', 'siswa@gmail.com')

    await page.goto('/student/dashboard')

    await expect(page).toHaveURL(/\/student\/dashboard/)
    await expect(page.getByRole('button', { name: /masuk dengan google/i })).toHaveCount(0)
  })
})
