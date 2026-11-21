export const KARTU_W_MM = 65
export const KARTU_H_MM = 95
export const KARTU_PADDING_MM = 3

/** css px per mm (96 dpi). Dipakai untuk menghitung ukuran pratinjau di layar. */
export const MM_TO_CSS_PX = 96 / 25.4

export function mmToPx(mm: number): number {
  return mm * MM_TO_CSS_PX
}

/**
 * Lebar area isi kartu setelah dikurangi padding kiri/kanan.
 */
export const KARTU_CONTENT_W_MM = KARTU_W_MM - KARTU_PADDING_MM * 2

/** Ukur sisi QR, tetap 22 mm agar densitas modul tetap di atas ambang scan. */
export const QR_SIZE_MM = 22
/** Padding putih pada pelat QR (mel supplementing quiet zone bawaan QR). */
export const QR_PLATE_PAD_MM = 1.2
/**
 * Jarak antar dua QR. Nilai ini tidak boleh melebihi QR_MAX_GAP_MM, kalau tidak
 * baris QR keluar dari kartu dan ikut terpotong garis potong pada batch A4.
 */
export const QR_GAP_MM = 8
/** Lebar maksimum label QR; harus <= lebar pelat agar tidak menambah kolom. */
export const QR_LABEL_MAX_W_MM = QR_SIZE_MM

/** Lebar satu kolom QR termasuk pelatnya. */
export const QR_COL_W_MM = QR_SIZE_MM + QR_PLATE_PAD_MM * 2
/** Total lebar baris dua QR beserta jaraknya. */
export const QR_ROW_W_MM = QR_COL_W_MM * 2 + QR_GAP_MM
/** Jarak maksimum yang masih muat di dalam area isi kartu. */
export const QR_MAX_GAP_MM = KARTU_CONTENT_W_MM - QR_COL_W_MM * 2
/** Margin efektif dari tepi kartu ke tepi pelat QR setelah baris dipusatkan. */
export const QR_SIDE_MARGIN_MM = KARTU_PADDING_MM + (KARTU_CONTENT_W_MM - QR_ROW_W_MM) / 2

export const A4_W_MM = 210
export const A4_H_MM = 297

export const A4_GRID_COLS = 3
export const A4_GRID_ROWS = 3
export const A4_MAX_CARDS = A4_GRID_COLS * A4_GRID_ROWS

export const A4_SHEET_OFFSET_X_MM = (A4_W_MM - A4_GRID_COLS * KARTU_W_MM) / 2
export const A4_SHEET_OFFSET_Y_MM = (A4_H_MM - A4_GRID_ROWS * KARTU_H_MM) / 2

/**
 * Membagi kartu menjadi lemb A4. Setiap lemb selalu berukuran `perSheet` slot;
 * slot yang tidak terisi diisi `null` supaya grid potong tetap utuh pada lemb
 * terakhir yang tidak penuh.
 */
export function chunkIntoSheets<T>(items: T[], perSheet: number): (T | null)[][] {
  if (perSheet <= 0) return []
  const sheets: (T | null)[][] = []
  for (let i = 0; i < items.length; i += perSheet) {
    const chunk: (T | null)[] = items.slice(i, i + perSheet)
    while (chunk.length < perSheet) chunk.push(null)
    sheets.push(chunk)
  }
  return sheets
}

const RESET_PRINT = `
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
  }

  body * {
    visibility: hidden !important;
  }

  .kartu-print-root,
  .kartu-print-root * {
    visibility: visible !important;
  }

  /* index.css menyembunyikan .kartu-print-root di layar; saat print harus
     dimunculkan lagi, kalau tidak area cetak tidak tercetak sama sekali. */
  .kartu-print-root {
    display: block !important;
    position: absolute !important;
    inset: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    height: auto !important;
    max-width: none !important;
    background: transparent !important;
  }

  .kartu {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
`

const SCREEN_HIDDEN = `
  .kartu-screen-shell {
    display: none !important;
  }
`

/**
 * Tata letak lembar A4 + panduan potong. Dipakai bersama oleh pratinjau di layar
 * dan hasil cetak supaya pratinjau benar-benar sama dengan yang keluar dari printer.
 * Garis potong memakai dashed agar tidak ikut terbaca sebagai bagian kartu.
 */
export function a4SheetCss(): string {
  return `
.a4-sheet {
  box-sizing: border-box !important;
  display: grid !important;
  grid-template-columns: repeat(${A4_GRID_COLS}, ${KARTU_W_MM}mm) !important;
  grid-auto-rows: ${KARTU_H_MM}mm !important;
  gap: 0 !important;
  overflow: hidden !important;
  padding: ${A4_SHEET_OFFSET_Y_MM}mm 0 0 ${A4_SHEET_OFFSET_X_MM}mm !important;
}

.a4-sheet > .kartu {
  outline: 0.2mm dashed rgba(255, 255, 255, 0.5) !important;
  outline-offset: -0.1mm !important;
}

/* Slot kosong pada lemb terakhir yang tidak penuh: tetap tercetak sebagai kotak
   putus-putus supaya admin tahu di mana batas potongnya. */
.kartu-slot-kosong {
  box-sizing: border-box !important;
  border: 0.2mm dashed #cbd5e1 !important;
  background: transparent !important;
}
`
}

export function kartuPrintCss(): string {
  return `
${a4SheetCss()}

@page {
  size: ${KARTU_W_MM}mm ${KARTU_H_MM}mm;
  margin: 0;
}

@media print {
${RESET_PRINT}
${SCREEN_HIDDEN}

  .kartu {
    width: ${KARTU_W_MM}mm !important;
    height: ${KARTU_H_MM}mm !important;
    margin: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: hidden !important;
  }
}
`
}

export function a4PrintCss(): string {
  return `
${a4SheetCss()}

@page {
  size: ${A4_W_MM}mm ${A4_H_MM}mm;
  margin: 0;
}

@media print {
${RESET_PRINT}
${SCREEN_HIDDEN}

  /* Cetak massal: area cetak mengikuti flow normal supaya browser bisa
     memecah otomatis antar lemb. Dipakai lewat kelas .kartu-print-flow,
     sehingga mode kartu satuan tidak terpengaruh. */
  .kartu-print-root.kartu-print-flow {
    position: static !important;
    inset: auto !important;
  }

  .a4-sheet {
    width: ${A4_W_MM}mm !important;
    height: ${A4_H_MM}mm !important;
    margin: 0 !important;
    break-after: page !important;
    page-break-after: always !important;
  }

  /* Tanpa ini, browser bisa menambah satu lemb kosong di akhir. */
  .a4-sheet:last-child {
    break-after: auto !important;
    page-break-after: auto !important;
  }
}
`
}

export function a4SinglePrintCss(): string {
  return `
${a4SheetCss()}

@page {
  size: ${A4_W_MM}mm ${A4_H_MM}mm;
  margin: 0;
}

@media print {
${RESET_PRINT}
${SCREEN_HIDDEN}

  .a4-sheet {
    width: ${A4_W_MM}mm !important;
    height: ${A4_H_MM}mm !important;
    margin: 0 !important;
    display: block !important;
  }

  /* Kartu satuan tidak memakai grid, jadi panduan potong dimatikan. */
  .a4-sheet > .kartu {
    outline: none !important;
  }
}
`
}

