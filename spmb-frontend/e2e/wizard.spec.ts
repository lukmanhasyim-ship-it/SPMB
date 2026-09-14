import { test, expect } from '@playwright/test'
import { mockBackend, seedSession } from './helpers'

test.describe('Wizard pendaftaran siswa', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'siswa', 'wizard@gmail.com')
  })

  test('mode awal step 1 menampilkan Pilihan Program Keahlian', async ({ page }) => {
    await page.goto('/student/wizard?mode=awal&step=1')

    await expect(page.getByText('Pilihan Program Keahlian').first()).toBeVisible()
  })

  test('mode final step 4 menampilkan Data Orang Tua/Wali', async ({ page }) => {
    await page.goto('/student/wizard?mode=final&step=4')

    await expect(page.getByText('Data Orang Tua/Wali')).toBeVisible()
  })
})
