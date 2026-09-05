import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { mockBackend, seedSession } from './helpers'

const LONG_PRESTASI =
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
  'kabupaten, serta mengikuti pelatihan kepemimpinan siswa tingkat provinsi.'

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
  prestasi: LONG_PRESTASI,
  referral_kategori: 'Guru SMK AL AZHAR SEMPU',
  referral_nama: 'Imam Saroni',
  foto_profil_url: '',
}

interface Band {
  from: number
  to: number
  mean: number
  frac: number
}

test('JPG hasil download identik dengan preview di layar', async ({ page }) => {
  await seedSession(page, 'admin')
  await mockBackend(page, { getSiswa: { status: 'ok', data: [STUDENT] } })
  await page.goto('/admin/formulir')
  await page.waitForLoadState('networkidle').catch(() => {})
  await expect(page.getByText(STUDENT.nama_lengkap)).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /Generate Formulir/i }).click()
  await expect(page.locator('#area-cetak .form-page')).toBeVisible()
  await page.waitForLoadState('load')
  await page.waitForTimeout(700)

  const state = await page.evaluate(() => {
    const scaled = document.querySelector<HTMLElement>('#area-cetak [style*="scale"]')
    const area = { w: 0, h: 0 }
    const el = document.getElementById('area-cetak') as HTMLElement
    area.w = el.offsetWidth
    area.h = el.offsetHeight
    return { transform: scaled?.style.transform ?? '', areaW: area.w, areaH: area.h }
  })
  console.log('AUTO-FIT', JSON.stringify(state))
  expect(state.transform).toContain('scale(')

  const shotPng = await page.locator('#area-cetak').screenshot()
  const shotB64 = shotPng.toString('base64')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Download JPG/i }).click()
  const download = await downloadPromise
  const jpgB64 = readFileSync(await download.path()).toString('base64')

  const diff = await page.evaluate(
    async ({ shotB64, jpgB64, W, H }) => {
      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.src = src
        })

      const jpg = await loadImg(`data:image/jpeg;base64,${jpgB64}`)
      const shot = await loadImg(`data:image/png;base64,${shotB64}`)

      const a = document.createElement('canvas')
      a.width = W
      a.height = H
      const actx = a.getContext('2d')!
      actx.drawImage(shot, 0, 0, W, H)

      const b = document.createElement('canvas')
      b.width = W
      b.height = H
      const bctx = b.getContext('2d')!
      bctx.drawImage(jpg, 0, 0, W, H)

      const pa = actx.getImageData(0, 0, W, H).data
      const pb = bctx.getImageData(0, 0, W, H).data

      const step = 6
      const nBands = 6
      const bandH = Math.floor(H / nBands)
      const bands: Band[] = []
      for (let bi = 0; bi < nBands; bi++) {
        let sum = 0
        let count = 0
        for (let y = bi * bandH; y < Math.min((bi + 1) * bandH, H); y += step) {
          for (let x = 0; x < W; x += step) {
            const i = (y * W + x) * 4
            sum +=
              Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2])
            count++
          }
        }
        bands.push({ from: bi / nBands, to: (bi + 1) / nBands, mean: sum / (count * 3), frac: 0 })
      }

      return { jpgW: jpg.naturalWidth, jpgH: jpg.naturalHeight, bands }
    },
    { shotB64, jpgB64, W: Math.round(state.areaW), H: Math.round(state.areaH) },
  )
  console.log('DIFF-BANDS', JSON.stringify(diff.bands))

  expect(diff.jpgW).toBeGreaterThan(2470)
  expect(diff.jpgW).toBeLessThan(2490)
  expect(diff.jpgH).toBeGreaterThan(3885)
  expect(diff.jpgH).toBeLessThan(3910)

  const maxBandMean = Math.max(...diff.bands.map((b) => b.mean))
  expect(maxBandMean).toBeLessThan(40)
})