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
  // Portal bottom bar bisa berganti node saat aksi utama muncul setelah data
  // selesai dimuat. Ulangi sebentar supaya pengukuran tidak kena race.
  let box = await locator.boundingBox()
  for (let attempt = 0; attempt < 10 && !box; attempt++) {
    await page.waitForTimeout(100)
    box = await locator.boundingBox()
  }
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  expect(box!.width).toBeGreaterThanOrEqual(44)
}

/** Pastikan bilah menempel di bawah viewport dan kembalikan locate-nya. */
async function expectBottomBar(page: Page) {
  const bar = page.getByRole('navigation', { name: 'Navigasi bawah' })
  // Bar di-portal setelah lazy chunk termuat; beri waktu ekstra saat CI lambat.
  await expect(bar).toBeVisible({ timeout: 10000 })
  const box = await bar.boundingBox()
  const viewportHeight = page.viewportSize()!.height
  expect(box).not.toBeNull()
  // Toleransi kecil untuk pembulatan sub-pixel pada DPR fraksional.
  expect(Math.abs(box!.y + box!.height - viewportHeight)).toBeLessThanOrEqual(3)
  return bar
}

/** Beranda + pintasan per role + Lainnya harus bisa disentuh. */
async function expectBottomBarActions(page: Page, shortcutLabels: string[]) {
  const bar = await expectBottomBar(page)
  await expectTouchTarget(page, bar.getByRole('link', { name: 'Beranda' }))
  for (const label of shortcutLabels) {
    await expectTouchTarget(page, bar.getByRole('link', { name: label, exact: true }))
  }
  const more = bar.getByRole('button', { name: 'Lainnya' })
  await expectTouchTarget(page, more)
  // Tombol Lainnya sengaja lebih tinggi dari minimum 44px.
  const moreBox = await more.boundingBox()
  expect(moreBox!.height).toBeGreaterThanOrEqual(52)
  return { bar, more }
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

    const { more } = await expectBottomBarActions(page, ['Lanjut Daftar'])
    await more.click()

    const sheet = page.getByRole('dialog', { name: 'Navigasi utama' })
    await expect(sheet).toBeVisible()
    // Beranda dan "Lanjut Daftar" sudah dipin di bar, jadi tidak diulang di sheet.
    await expect(sheet.getByText('Bukti Pendaftaran')).toBeVisible()
    await expect(sheet.getByRole('link', { name: 'Dashboard', exact: true })).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
    await expect(more).toBeFocused()
    await expectNoHorizontalOverflow(page)
  })

  test('drawer admin bisa dibuka dan fokus dikembalikan', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'admin')
    await page.goto('/admin/dashboard')

    const { more } = await expectBottomBarActions(page, ['Siswa', 'Daftar', 'Kartu', 'Gelombang'])
    await more.click()

    const sheet = page.getByRole('dialog', { name: 'Menu navigasi' })
    await expect(sheet).toBeVisible()
    // Timeline sengaja tidak dipin, jadi tetap bisa diakses lewat sheet.
    await expect(sheet.getByText('Timeline')).toBeVisible()
    await expect(sheet.getByRole('link', { name: 'Dashboard', exact: true })).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
    await expect(more).toBeFocused()
    await expectNoHorizontalOverflow(page)
  })

  test('aksi utama guru tampil di bottom bar', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'guru')
    await page.goto('/guru/dashboard')

    await expect(page.getByRole('navigation', { name: 'Navigasi bawah' })).toBeVisible()
    await expectBottomBarActions(page, ['Daftarkan Siswa'])
    await expectNoHorizontalOverflow(page)
  })

  test('aksi utama MPLS tampil di bottom bar dan sheet bisa dibuka', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'panitia_mpls')
    await page.goto('/mpls/dashboard')

    const { more } = await expectBottomBarActions(page, ['Scan Absen', 'Informasi'])
    await more.click()
    await expect(page.getByRole('dialog', { name: 'Menu navigasi' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expectNoHorizontalOverflow(page)
  })

  test('cetak kartu tidak overflow dan tombol aksi dapat disentuh', async ({ page }) => {
    await mockBackend(page)
    await seedSession(page, 'admin')
    await page.goto('/admin/cetak-kartu')

    await expect(page.getByRole('heading', { name: 'Cetak Kartu Massal' })).toBeVisible({ timeout: 15_000 })
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

  test('bottom bar tetap ada saat berpindah dashboard → wizard → kartu', async ({ page }) => {
    // Data lengkap supaya kartu tidak redirect dan pintasannya "Lihat Kartu".
    const siswaLengkap = {
      status: 'ok',
      data: {
        id_pendaftaran: 'SPMB-2026-0001',
        email: 'siswa@gmail.com',
        pilihan_jurusan: 'tkj',
        nama_lengkap: 'Siswa Uji',
        jenis_kelamin: 'Laki-laki',
        nisn: '1234567890',
        nik: '1234567890123456',
        tempat_lahir: 'Sempu',
        tanggal_lahir: '2008-05-12',
        agama: 'Islam',
        asal_sekolah: 'SMPN 1 Sempu',
        dusun: 'Sempu',
        desa: 'Sempu',
        kecamatan: 'Sempu',
        kabupaten: 'Banyuwangi',
        koordinat_maps: '-8.123,114.123',
        status_pendaftaran: 'Terverifikasi',
      },
    }
    await mockBackend(page, { getSiswa: siswaLengkap })
    await seedSession(page, 'siswa', 'siswa@gmail.com')
    await page.goto('/student/dashboard')

    async function bukaLainnyaDanBuka(label: string) {
      const bar = await expectBottomBar(page)
      const more = bar.getByRole('button', { name: 'Lainnya' })
      await expectTouchTarget(page, more)
      await more.click()

      const sheet = page.getByRole('dialog', { name: 'Navigasi utama' })
      await expect(sheet).toBeVisible()
      await sheet.getByRole('link', { name: label, exact: true }).click()
      await expect(sheet).toHaveCount(0)
    }

    await expectBottomBarActions(page, ['Lihat Kartu'])
    await expectNoHorizontalOverflow(page)

    await bukaLainnyaDanBuka('Formulir')
    await expect(page).toHaveURL(/\/student\/wizard/)
    await expectBottomBarActions(page, ['Lihat Kartu'])
    await expectNoHorizontalOverflow(page)

    // Kartu sudah dipin sebagai "Lihat Kartu", jadi tidak ada duplikat di sheet.
    const bar = await expectBottomBar(page)
    await bar.getByRole('link', { name: 'Lihat Kartu', exact: true }).click()
    await expect(page).toHaveURL(/\/student\/kartu-pendaftaran/)
    await expectBottomBarActions(page, ['Lihat Kartu'])
    await expectNoHorizontalOverflow(page)
  })
})
