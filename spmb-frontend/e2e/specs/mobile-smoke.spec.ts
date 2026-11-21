import { test, expect, type Page, type Locator } from '@playwright/test'
import { mockBackend, seedSession } from './helpers'

async function expectNoHorizontalOverflow(page: Page) {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  // Toleransi 1px untuk pembulatan sub-pixel.
  expect(size.scrollWidth).toBeLessThanOrEqual(size.clientWidth + 1)
}

async function expectTouchTarget(page: Page, locator: Locator) {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  expect(box!.width).toBeGreaterThanOrEqual(44)
}

/** Pastikan bilah menempel di bawah viewport dan kembalikan locate-nya. */
async function expectBottomBar(page: Page) {
  const bar = page.getByRole('navigation', { name: 'Navigasi bawah' })
  await expect(bar).toBeVisible()
  const box = await bar.boundingBox()
  const viewportHeight = page.viewportSize()!.height
  expect(box).not.toBeNull()
  // Toleransi kecil untuk pembulatan sub-pixel pada DPR fraksional.
  expect(Math.abs(box!.y + box!.height - viewportHeight)).toBeLessThanOrEqual(3)
  return bar
}

/** Menu + aksi utama per role harus bisa disentuh dan tidak overflow. */
async function expectBottomBarActions(page: Page, primaryLabel: string) {
  const bar = await expectBottomBar(page)
  await expectTouchTarget(page, bar.getByRole('link', { name: 'Beranda' }))
  await expectTouchTarget(page, bar.getByRole('link', { name: primaryLabel }))
  const menu = bar.getByRole('button', { name: 'Buka menu' })
  await expectTouchTarget(page, menu)
  return { bar, menu }
}

test.describe('Mobile smoke (375x812)', () => {
  test('halaman login muat tanpa horizontal scroll', async ({ page }) => {
    await mockBackend(page)
    await page.goto('/')

    const masuk = page.getByRole('button', { name: /masuk dengan google/i })
    await expect(masuk).toBeVisible()
    await expectTouchTarget(page, masuk)
    await expectNoHorizontalOverflow(page)
  })

  test('drawer siswa bisa dibuka dan ditutup dengan Escape', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'siswa', 'siswa@gmail.com')
    await page.goto('/student/dashboard')

    const { menu } = await expectBottomBarActions(page, 'Lanjut Daftar')
    await menu.click()

    const sheet = page.getByRole('dialog', { name: 'Navigasi utama' })
    await expect(sheet).toBeVisible()
    await expect(sheet.getByText('Formulir')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
    await expect(menu).toBeFocused()
    await expectNoHorizontalOverflow(page)
  })

  test('drawer admin bisa dibuka dan fokus dikembalikan', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'admin')
    await page.goto('/admin/dashboard')

    const { menu } = await expectBottomBarActions(page, 'Data Siswa')
    await menu.click()

    const sheet = page.getByRole('dialog', { name: 'Menu navigasi' })
    await expect(sheet).toBeVisible()
    await expect(sheet.getByText('Data Siswa')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
    await expect(menu).toBeFocused()
    await expectNoHorizontalOverflow(page)
  })

  test('aksi utama guru tampil di bottom bar', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'guru')
    await page.goto('/guru/dashboard')

    await expect(page.getByRole('navigation', { name: 'Navigasi bawah' })).toBeVisible()
    await expectBottomBarActions(page, 'Daftarkan Siswa')
    await expectNoHorizontalOverflow(page)
  })

  test('aksi utama MPLS tampil di bottom bar dan sheet bisa dibuka', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'panitia_mpls')
    await page.goto('/mpls/dashboard')

    const { menu } = await expectBottomBarActions(page, 'Scan Absen')
    await menu.click()
    await expect(page.getByRole('dialog', { name: 'Menu navigasi' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expectNoHorizontalOverflow(page)
  })

  test('cetak kartu tidak overflow dan tombol aksi dapat disentuh', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'admin')
    await page.goto('/admin/cetak-kartu')

    await expect(page.getByRole('heading', { name: 'Cetak Kartu Massal' })).toBeVisible()
    await expectTouchTarget(page, page.getByRole('textbox', { name: 'Cari siswa' }))
    await expectTouchTarget(page, page.getByRole('button', { name: /cetak semua/i }))
    await expectNoHorizontalOverflow(page)
  })

  test('formulir siswa tidak overflow pada langkah pertama', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'siswa', 'siswa@gmail.com')
    await page.goto('/student/wizard')

    await expectNoHorizontalOverflow(page)
    const lanjut = page.getByRole('button', { name: /selanjutnya/i }).first()
    await expectTouchTarget(page, lanjut)
  })
})
