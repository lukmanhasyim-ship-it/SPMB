import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { mockBackend, seedSession } from './helpers'

const STUDENT = {
  tahun_ajaran: '2026/2027',
  id_pendaftaran: 'SPMB-2728-X-B36200F',
  email: 'calonsiswa@gmail.com',
  gelombang: 'Inden',
  nama_lengkap: 'My Dolan My Blakraan',
  nama_ayah: 'Dd',
  nama_ibu: 'Us',
  jenis_kelamin: 'Laki-laki',
  agama: 'Islam',
  pilihan_jurusan: 'tkj',
  pilihan_alternatif: 'akl',
  asal_sekolah: 'SMP 1 Sempu',
  alasan_pilih_jurusan: 'Suka menghitung',
  nisn: '1234567890',
  nik: '3510203012940001',
  tempat_lahir: 'Banyuwangi',
  tanggal_lahir: '2010-07-19',
  dusun: 'Dapadan',
  rt_rw: '002/002',
  desa: 'Karangsari',
  kecamatan: 'Sempu',
  kabupaten: 'Banyuwangi',
  kode_pos: '68468',
  tinggal_bersama: 'Orang Tua',
  telepon_siswa: '6281234567788',
  telepon_ortu: '6282330295812',
  estimasi_penghasilan_ortu: 'Rp. 500.000, - sd Rp. 1.000.000,-',
  prestasi:
    'Juara 1 lomba melamun tingkat nasional. ' +
    'Menjadi juara 2 lomba tidur siang tingkat provinsi. ' +
    'Meraih penghargaan siswa paling rajin mengumpulkan tugas tepat waktu ' +
    'selama tiga tahun berturut-turut di SMP. ' +
    'Pernah mengikuti lomba fotografi alam, lomba pidato bahasa Inggris, ' +
    'serta lomba cerdas cermat antar sekolah se-kecamatan dan meraih juara harapan. ' +
    'Aktif dalam kegiatan pramuka dan PMR di sekolah, serta pernah menjadi ' +
    'ketua kelas selama dua tahun. Prestasi lainnya di bidang olahraga, ' +
    'khususnya bulu tangkis dan sepak bola tingkat desa. ' +
    'Mengikuti kelas ekstrakurikuler musik dan seni tari, terpilih sebagai ' +
    'pemain utama dalam pentas seni sekolah, dan turut membantu panitia ' +
    'acara perpisahan kelas. Ikut serta dalam kegiatan bakti sosial dan ' +
    'donor darah yang diselenggarakan sekolah bekerja sama dengan puskesmas. ' +
    'Meraih peringkat pertama kelas pada semester genap, peringkat kedua ' +
    'pada semester ganjil, serta menjadi pengurus OSIS bidang keagamaan. ' +
    'Pernah mewakili sekolah dalam lomba menulis cerpen dan puisi tingkat ' +
    'kabupaten, serta mengikuti pelatihan kepemimpinan siswa tingkat provinsi.',
  referral_kategori: 'Guru SMK AL AZHAR SEMPU',
  referral_nama: 'Imam Saroni',
  foto_profil_url: '',
}

function jpegSize(buf: Buffer): { width: number; height: number } {
  let i = 2
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1
      continue
    }
    const marker = buf[i + 1]
    if (marker === 0xd8 || marker === 0xd9) {
      i += 2
      continue
    }
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return {
        height: buf.readUInt16BE(i + 5),
        width: buf.readUInt16BE(i + 7),
      }
    }
    const length = buf.readUInt16BE(i + 2)
    i += 2 + length
  }
  throw new Error('JPEG SOF marker tidak ditemukan')
}

async function renderForm(page: import('@playwright/test').Page) {
  await seedSession(page, 'admin')
  await mockBackend(page, {
    getSiswa: { status: 'ok', data: [STUDENT] },
  })

  await page.goto('/admin/formulir')
  await expect(page.getByText(STUDENT.nama_lengkap)).toBeVisible()
  await page.getByRole('button', { name: /Generate Formulir/i }).click()
  await expect(page.locator('#area-cetak .form-page')).toBeVisible()
  await page.waitForLoadState('load')
  await page.waitForTimeout(800)
}

test('download JPG menghasilkan gambar F4 300 DPI (2480x3897)', async ({ page }) => {
  await renderForm(page)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Download JPG/i }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('Formulir-SPMB-2728-X-B36200F.jpg')
  const path = await download.path()
  const buf = readFileSync(path)

  expect(buf[0]).toBe(0xff)
  expect(buf[1]).toBe(0xd8)
  expect(buf[2]).toBe(0xff)

  const { width, height } = jpegSize(buf)
  expect(width).toBeGreaterThanOrEqual(2470)
  expect(width).toBeLessThanOrEqual(2490)
  expect(height).toBeGreaterThanOrEqual(3885)
  expect(height).toBeLessThanOrEqual(3910)
  expect(buf.length).toBeGreaterThan(100_000)
})

test('cetak memakai iframe gambar JPG ukuran F4 tanpa margin', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {}
  })

  await renderForm(page)

  await page.getByRole('button', { name: /Cetak/i }).click()
  await page.waitForSelector('#formulir-print-frame', { state: 'attached', timeout: 30_000 })

  const frameInfo = await page.evaluate(() => {
    const iframe = document.getElementById('formulir-print-frame') as HTMLIFrameElement | null
    if (!iframe || !iframe.contentDocument) return null
    const doc = iframe.contentDocument
    const img = doc.querySelector('img')
    const headText = doc.head?.textContent ?? ''
    return {
      hasJpeg: (img?.src ?? '').startsWith('data:image/jpeg'),
      pageRuleF4: headText.includes('size: 210mm 330mm'),
      marginZero: headText.includes('margin: 0'),
      imgWidthMm: headText.includes('width: 210mm'),
      imgHeightMm: headText.includes('height: 330mm'),
    }
  })

  expect(frameInfo).not.toBeNull()
  expect(frameInfo?.hasJpeg).toBe(true)
  expect(frameInfo?.pageRuleF4).toBe(true)
  expect(frameInfo?.marginZero).toBe(true)
  expect(frameInfo?.imgWidthMm).toBe(true)
  expect(frameInfo?.imgHeightMm).toBe(true)
})