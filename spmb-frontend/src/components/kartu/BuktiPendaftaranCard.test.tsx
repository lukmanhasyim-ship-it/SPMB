import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import BuktiPendaftaranCard, { KartuData } from './BuktiPendaftaranCard'
import { QR_MODULE_COLOR } from '../../utils/waGroup'
import {
  A4_GRID_COLS,
  A4_GRID_ROWS,
  A4_H_MM,
  A4_MAX_CARDS,
  A4_SHEET_OFFSET_X_MM,
  A4_SHEET_OFFSET_Y_MM,
  A4_W_MM,
  KARTU_CONTENT_W_MM,
  KARTU_H_MM,
  KARTU_PADDING_MM,
  KARTU_W_MM,
  QR_COL_W_MM,
  QR_GAP_MM,
  QR_LABEL_MAX_W_MM,
  QR_MAX_GAP_MM,
  QR_PLATE_PAD_MM,
  QR_ROW_W_MM,
  QR_SIDE_MARGIN_MM,
  QR_SIZE_MM,
  a4PrintCss,
  a4SheetCss,
  a4SinglePrintCss,
  chunkIntoSheets,
  kartuPrintCss,
} from '../../utils/kartuPrint'

const MM_TO_PX = 96 / 25.4

const base: KartuData = {
  nama: 'Ahmad Fauzi',
  email: 'ahmad@example.com',
  idPendaftaran: 'SPMB-2026-000123',
  jurusanLabel: 'AK - Akuntansi',
  gelombang: 'Gelombang 1',
  tahunAjaran: '2026/2027',
  waktuDaftar: '12 Mar 2026 10:30',
  status: 'Terdaftar',
  initials: 'A',
}

describe('kartuPrint konstanta', () => {
  it('kartu 65 x 95 mm', () => {
    expect(KARTU_W_MM).toBe(65)
    expect(KARTU_H_MM).toBe(95)
    expect(KARTU_PADDING_MM).toBe(3)
  })

  it('A4 memuat 9 kartu dengan margin aman untuk printer', () => {
    expect(A4_W_MM).toBe(210)
    expect(A4_H_MM).toBe(297)
    expect(A4_GRID_COLS * A4_GRID_ROWS).toBe(9)
    expect(A4_MAX_CARDS).toBe(9)

    // lebar: 3 x 65 = 195, sisa dibagi 2
    expect(A4_SHEET_OFFSET_X_MM).toBe(7.5)
    // tinggi: 3 x 95 = 285, sisa dibagi 2 -> 6mm (border tak-tercetak laser ~4-5mm)
    expect(A4_SHEET_OFFSET_Y_MM).toBe(6)

    // margin harus >= 5mm supaya tidak terpotong
    expect(A4_SHEET_OFFSET_X_MM).toBeGreaterThanOrEqual(5)
    expect(A4_SHEET_OFFSET_Y_MM).toBeGreaterThanOrEqual(5)

    // kartu tidak boleh melewati tepi kertas
    expect(A4_GRID_COLS * KARTU_W_MM + A4_SHEET_OFFSET_X_MM * 2).toBeLessThanOrEqual(A4_W_MM)
    expect(A4_GRID_ROWS * KARTU_H_MM + A4_SHEET_OFFSET_Y_MM * 2).toBeLessThanOrEqual(A4_H_MM)
  })
})

describe('kartuPrint css', () => {
  it('mode kartu memakai @page 65mm x 95mm', () => {
    const css = kartuPrintCss()
    expect(css).toContain('size: 65mm 95mm')
    expect(css).toContain('width: 65mm !important')
    expect(css).toContain('height: 95mm !important')
  })

  it('semua mode menyembunyikan elemen di luar area cetak', () => {
    for (const css of [kartuPrintCss(), a4PrintCss(), a4SinglePrintCss()]) {
      expect(css).toContain('visibility: hidden !important')
      expect(css).toContain('.kartu-print-root')
      expect(css).toContain('print-color-adjust: exact !important')
    }
  })

  it('mode A4 memakai grid 3x3 tanpa celah', () => {
    const css = a4PrintCss()
    expect(css).toContain('size: 210mm 297mm')
    expect(css).toContain('grid-template-columns: repeat(3, 65mm) !important')
    expect(css).toContain('grid-auto-rows: 95mm !important')
    expect(css).toContain('gap: 0 !important')
  })

  it('setiap lemb A4 dipaksa ke halaman baru, kecuali yang terakhir', () => {
    const css = a4PrintCss()
    expect(css).toContain('break-after: page !important')
    expect(css).toContain('page-break-after: always !important')
    // Tanpa override ini, browser bisa menambah satu lemb kosong di akhir.
    expect(css).toMatch(/\.a4-sheet:last-child\s*\{[^}]*break-after: auto !important/)
  })

  it('area cetak massal memakai flow normal agar bisa dipaginasi', () => {
    const css = a4PrintCss()
    expect(css).toMatch(
      /\.kartu-print-root\.kartu-print-flow\s*\{[^}]*position: static !important[^}]*\}/
    )
    // Mode kartu satuan tidak boleh ikut memakai flow.
    expect(kartuPrintCss()).not.toContain('kartu-print-flow')
    expect(a4SinglePrintCss()).not.toContain('kartu-print-flow')
  })

  it('lembar A4 memuat panduan potong di setiap kartu', () => {
    const css = a4SheetCss()
    expect(css).toContain('grid-template-columns: repeat(3, 65mm) !important')
    expect(css).toContain('grid-auto-rows: 95mm !important')
    expect(css).toMatch(/\.a4-sheet > \.kartu\s*\{[^}]*outline: 0\.2mm dashed/)
  })

  it('kartu satuan mematikan panduan potong', () => {
    expect(a4SinglePrintCss()).toMatch(/\.a4-sheet > \.kartu\s*\{[^}]*outline: none/)
  })

  it('area cetak dimunculkan lagi saat print', () => {
    // Regression: index.css menyembunyikan .kartu-print-root, jadi setiap mode
    // print wajib memunculkannya lagi di dalam @media print.
    for (const css of [kartuPrintCss(), a4PrintCss(), a4SinglePrintCss()]) {
      const printBlock = css.slice(css.indexOf('@media print'))
      expect(printBlock).toMatch(/\.kartu-print-root\s*\{[^}]*display: block !important/)
    }
  })

  it('index.css menyembunyikan area cetak di layar', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
    expect(css).toMatch(/^\.kartu-print-root\s*\{\s*display: none;\s*\}$/m)
  })

  it('mode A4 satuan hanya menampilkan satu kartu', () => {
    expect(a4SinglePrintCss()).toContain('display: block !important')
    expect(a4SinglePrintCss()).toContain('size: 210mm 297mm')
  })
})

describe('chunkIntoSheets', () => {
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `K${i}`)

  it('mengembalikan nol lemb untuk data kosong', () => {
    expect(chunkIntoSheets([], A4_MAX_CARDS)).toEqual([])
  })

  it('membagi data yang tidak kelipatan 9 tanpa membuang sisa', () => {
    expect(chunkIntoSheets(ids(137), A4_MAX_CARDS)).toHaveLength(16) // ceil(137/9)
    expect(chunkIntoSheets(ids(10), A4_MAX_CARDS)).toHaveLength(2)
    expect(chunkIntoSheets(ids(1), A4_MAX_CARDS)).toHaveLength(1)
    expect(chunkIntoSheets(ids(9), A4_MAX_CARDS)).toHaveLength(1)
  })

  it('tiap lemb selalu 9 slot, sisa diisi null', () => {
    for (const n of [1, 8, 9, 10, 17, 18, 20, 137]) {
      const sheets = chunkIntoSheets(ids(n), A4_MAX_CARDS)
      expect(sheets.every((s) => s.length === A4_MAX_CARDS)).toBe(true)
      const filled = sheets.flat().filter((x) => x !== null)
      expect(filled).toHaveLength(n)
    }
  })

  it('lemb terakhir memuat sisa, dan tidak ada data yang hilang atau terduplikasi', () => {
    const input = ids(20)
    const sheets = chunkIntoSheets(input, A4_MAX_CARDS)
    expect(sheets).toHaveLength(3)
    expect(sheets[0]).toEqual(ids(9).slice(0, 9))
    expect(sheets[1]).toEqual(input.slice(9, 18))
    expect(sheets[2]).toEqual([...input.slice(18), null, null, null, null, null, null, null])
    expect(sheets.flat().filter((x) => x !== null)).toEqual(input)
  })

  it('menolak perSheet tidak valid agar tidak looping tanpa batas', () => {
    expect(chunkIntoSheets(ids(5), 0)).toEqual([])
    expect(chunkIntoSheets(ids(5), -1)).toEqual([])
  })
})

describe('BuktiPendaftaranCard', () => {
  it('berukuran tepat 65 x 95 mm', () => {
    const { container } = render(<BuktiPendaftaranCard data={base} />)
    const el = container.querySelector('.kartu') as HTMLElement
    expect(el.style.width).toBe('65mm')
    expect(el.style.height).toBe('95mm')
    // 65mm = 245.67px, 95mm = 359.06px pada 96dpi
    expect(65 * MM_TO_PX).toBeCloseTo(245.67, 2)
    expect(95 * MM_TO_PX).toBeCloseTo(359.06, 2)
  })

  it('menampilkan dua QR code 22 mm', () => {
    const { container } = render(<BuktiPendaftaranCard data={base} />)
    const codes = container.querySelectorAll('svg[viewBox]')
    expect(codes).toHaveLength(2)
    codes.forEach((code) => {
      const el = code as HTMLElement
      expect(el.getAttribute('height')).toBe('83')
      expect(el.style.width).toBe(`${QR_SIZE_MM}mm`)
      expect(el.style.height).toBe(`${QR_SIZE_MM}mm`)
    })
    expect(22 * MM_TO_PX).toBeCloseTo(83.15, 2)
  })

  it('baris QR muat di area isi kartu dan tidak keluar dari kartu', () => {
    const { container } = render(<BuktiPendaftaranCard data={base} />)

    const row = container.querySelector<HTMLElement>('div[style*="gap"]')
    const plates = container.querySelectorAll<HTMLElement>('div[style*="padding"]')
    expect(row).not.toBeNull()
    expect(plates).toHaveLength(2)

    // Nilai diambil dari DOM, bukan dari konstanta, supaya test ini benar-benar
    // mengukur apa yang dirender dan bukan sekadar mengulang definisinya.
    const gap = parseFloat(row!.style.gap)
    const pad = parseFloat(plates[0].style.padding)
    const qr = parseFloat(
      container.querySelector<HTMLElement>('svg[viewBox]')!.style.width
    )

    expect(gap).toBeGreaterThan(0)
    expect(pad).toBeGreaterThan(0)
    expect(qr).toBe(22)
    plates.forEach((plate) => expect(parseFloat(plate.style.padding)).toBe(pad))

    const rowWidth = 2 * (qr + pad * 2) + gap
    expect(rowWidth).toBeLessThanOrEqual(KARTU_CONTENT_W_MM)
    // Margin efektif harus tetap minimal sebesar padding kartu, kalau tidak QR
    // bisa menyentuh tepi kartu dan ikut terpotong garis potong pada batch A4.
    const sideMargin = KARTU_PADDING_MM + (KARTU_CONTENT_W_MM - rowWidth) / 2
    expect(sideMargin).toBeGreaterThanOrEqual(KARTU_PADDING_MM)
    // Beri buffer supaya tidak pas-pas dengan toleransi pembulatan px.
    expect(KARTU_CONTENT_W_MM - rowWidth).toBeGreaterThan(0.5)
  })

  it('jarak antar QR tidak mungkin diperlebar sampai keluar kartu', () => {
    // nilai desain, dikunci supaya tidak ikut bergeser
    expect(QR_SIZE_MM).toBe(22)
    expect(QR_PLATE_PAD_MM).toBe(1.2)
    expect(QR_GAP_MM).toBeGreaterThan(0)
    expect(QR_GAP_MM).toBeLessThanOrEqual(QR_MAX_GAP_MM)
    expect(QR_ROW_W_MM).toBeLessThanOrEqual(KARTU_CONTENT_W_MM)
    // nilai turunan harus konsisten dengan definisinya
    expect(KARTU_CONTENT_W_MM).toBe(59)
    expect(QR_ROW_W_MM).toBeCloseTo(56.8, 5)
    expect(QR_MAX_GAP_MM).toBeCloseTo(10.2, 5)
    expect(QR_SIDE_MARGIN_MM).toBeCloseTo(4.1, 5)
  })

  it('label QR tidak pernah membuat kolom lebih lebar dari pelat', () => {
    expect(QR_LABEL_MAX_W_MM).toBeLessThanOrEqual(QR_COL_W_MM)
    const { container } = render(<BuktiPendaftaranCard data={base} />)
    const labels = container.querySelectorAll<HTMLElement>('p[style*="max-width"]')
    expect(labels).toHaveLength(2)
    labels.forEach((label) => {
      expect(parseFloat(label.style.maxWidth)).toBeLessThanOrEqual(QR_COL_W_MM)
    })
  })

  it('densitas QR di atas ambang 0,5 mm per modul', () => {
    const { container } = render(<BuktiPendaftaranCard data={base} />)
    const codes = Array.from(container.querySelectorAll('svg[viewBox]'))
    expect(codes).toHaveLength(2)

    for (const code of codes) {
      // viewBox berisi jumlah sel termasuk margin (4 sel tiap sisi)
      const units = parseInt(code.getAttribute('viewBox')!.split(' ')[3], 10)
      const density = 22 / units
      expect(density).toBeGreaterThan(0.5)
    }
  })

  // base tidak punya linkGroupWA, jadi test di atas hanya mengukur QR ID.
  // QR grup jauh lebih padat (level H + URL invite), jadi diuji terpisah.
  it('QR grup: densitas tetap di atas 0,4 mm/modul dan logo di bawah 30% lebar', () => {
    const link = 'https://chat.whatsapp.com/G1aBcDeFgHiJkLmNoPqRs'
    const { container } = render(
      <BuktiPendaftaranCard data={{ ...base, linkGroupWA: link }} />
    )
    const waCode = container.querySelector('svg[viewBox]') as SVGSVGElement
    const units = parseInt(waCode.getAttribute('viewBox')!.split(' ')[3], 10)

    expect(22 / units).toBeGreaterThan(0.4)

    const logoUnits = parseFloat(waCode.querySelector('image')!.getAttribute('width')!)
    expect(logoUnits / units).toBeLessThan(0.3)
  })

  it('modul QR memakai warna yang sama dengan glyph logo', () => {
    const { container } = render(
      <BuktiPendaftaranCard data={{ ...base, linkGroupWA: 'https://chat.whatsapp.com/G1' }} />
    )
    const waCode = container.querySelector('svg[viewBox]') as SVGSVGElement
    // Path pertama adalah latar (bgColor), modul QR ada di path berikutnya.
    const moduleFills = Array.from(waCode.querySelectorAll('path'))
      .map((p) => p.getAttribute('fill'))
      .filter((f) => f !== 'transparent')
    expect(moduleFills).toContain(QR_MODULE_COLOR)
  })

  it('menyisipkan logo WhatsApp hanya bila link grup tersedia', () => {
    const tanpa = render(<BuktiPendaftaranCard data={base} />)
    expect(tanpa.container.querySelectorAll('image')).toHaveLength(0)

    const dengan = render(
      <BuktiPendaftaranCard data={{ ...base, linkGroupWA: 'https://chat.whatsapp.com/ABC' }} />
    )
    expect(dengan.container.querySelectorAll('image')).toHaveLength(1)
  })

  it('memakai id yang diberikan untuk target cetak', () => {
    const { container } = render(<BuktiPendaftaranCard data={base} id="area-cetak" />)
    expect(container.querySelector('#area-cetak')).not.toBeNull()
  })
})