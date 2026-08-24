import { test, expect } from '@playwright/test'
import { mockBackend, seedSession } from './helpers'

test.describe('Route guard & permission', () => {
  test('tamu dialihkan ke halaman masuk', async ({ page }) => {
    await mockBackend(page)

    await page.goto('/student/dashboard')

    await expect(page).toHaveURL(/localhost:\d+\/$/)
    await expect(page.getByRole('button', { name: /masuk dengan google/i })).toBeVisible()
  })

  test('siswa ditolak mengakses panel admin', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'siswa')

    await page.goto('/admin/dashboard')

    await expect(page).toHaveURL(/localhost:\d+\/$/)
    await expect(page.getByRole('button', { name: /masuk dengan google/i })).toBeVisible()
  })

  test('admin dapat mengakses panel admin', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'admin')

    await page.goto('/admin/dashboard')

    await expect(page).toHaveURL(/\/admin\/dashboard/)
  })
})
