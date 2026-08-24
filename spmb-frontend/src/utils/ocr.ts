export type JenisDokumen = 'KK' | 'KTP'

export interface HasilEkstraksiAlamat {
  alamat?: string
  rtRw?: string
  desa?: string
  kecamatan?: string
  kabupaten?: string
  kodePos?: string
}

const TARGET_WIDTH = 1600

const STATUS_LABELS: Record<string, string> = {
  'loading tesseract core': 'Menyiapkan mesin pembaca...',
  'initializing tesseract': 'Menyiapkan mesin pembaca...',
  'loading language traineddata': 'Mengunduh data bahasa (sekali saja)...',
  'initializing api': 'Memulai pembacaan dokumen...',
  'recognizing text': 'Membaca teks dokumen...',
}

export async function preprocessDokumen(file: File): Promise<{ blob: Blob; base64: string; dataUrl: string }> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    bitmap = await createImageBitmap(file)
  }

  const scale = Math.max(TARGET_WIDTH / bitmap.width, 1)
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Browser tidak mendukung pemrosesan gambar')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, w, h)
  const px = imageData.data
  const kontras = 1.35
  for (let i = 0; i < px.length; i += 4) {
    let g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
    g = (g - 128) * kontras + 128
    g = g < 0 ? 0 : g > 255 ? 255 : g
    px[i] = g
    px[i + 1] = g
    px[i + 2] = g
  }
  ctx.putImageData(imageData, 0, 0)

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Gagal memproses gambar'))),
      'image/jpeg',
      0.85,
    ),
  )
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

  return { blob, base64: dataUrl.split(',')[1], dataUrl }
}

export async function runOcr(
  gambar: Blob,
  onProgress?: (progress: number, status: string) => void,
): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('ind+eng', 1, {
    logger: (m) => {
      onProgress?.(m.progress || 0, STATUS_LABELS[m.status] || 'Memproses...')
    },
  })
  try {
    const hasil = await worker.recognize(gambar)
    return hasil.data.text || ''
  } finally {
    await worker.terminate()
  }
}

function normalisasi(teks: string): string[] {
  return teks
    .replace(/\r/g, '')
    .replace(/[;|=]/g, ':')
    .replace(/[\u2013\u2014]/g, '-')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
}

function bersihkan(nilai: string): string {
  return nilai
    .replace(/^[\s:.•·]+/, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s.,:;]+$/, '')
    .trim()
}

const RE_POTONG_LABEL =
  /\s+\b(rt\s*\/\s*rw|desa\s*\/?\s*k\.?elurahan|kelurahan|desa|kecamatan|kab(?:upaten)?\s*\/?\s*k\.?ota|kabupaten|provinsi|kode\s*pos|nik|gol\.?\s*darah|tempat\s*\/?\s*tgl|jenis\s*kelamin|agama|status\s*perkawinan|pekerjaan)\b/i

function potongLabel(nilai: string): string {
  const m = nilai.match(RE_POTONG_LABEL)
  const terpotong = m && m.index !== undefined ? nilai.slice(0, m.index) : nilai
  return bersihkan(terpotong)
}

const RE_LANJUTAN_ALAMAT =
  /\brt\s*\/\s*rw\b|\bdesa\b|\bkelurahan\b|\bkecamatan\b|\bkabupaten\b|\bkota\b|\bprovinsi\b|\bkode\s*pos\b|\bgol\.?\s*darah\b|\bnik\b|\bnama\b/i

export function extractAlamat(teksMentah: string): HasilEkstraksiAlamat {
  const baris = normalisasi(teksMentah)
  const hasil: HasilEkstraksiAlamat = {}

  const cari = (regex: RegExp): string => {
    for (const l of baris) {
      const m = l.match(regex)
      if (m && m[1]) {
        const v = potongLabel(m[1])
        if (v) return v
      }
    }
    return ''
  }

  hasil.alamat = cari(/\balamat\s*(?:tinggal)?\s*:?\s*(.+)/i)
  if (hasil.alamat) {
    const idx = baris.findIndex((l) => /\balamat\b/i.test(l))
    const lanjutan = baris[idx + 1]
    if (
      lanjutan &&
      lanjutan.length <= 45 &&
      !lanjutan.includes(':') &&
      !RE_LANJUTAN_ALAMAT.test(lanjutan)
    ) {
      hasil.alamat = `${hasil.alamat} ${lanjutan}`.trim()
    }
  }
  hasil.alamat = potongLabel(hasil.alamat || '')

  const rt = cari(/\br\.?\s?t\.?\s*\/\s*r\.?\s?w\.?\s*:?\s*(\d{1,3}\s*\/\s*\d{1,3})/i)
  hasil.rtRw = rt ? rt.replace(/\s+/g, '') : ''

  hasil.desa =
    cari(/\bdesa\s*\/\s*k\.?elurahan\s*:?\s*(.+)/i) ||
    cari(/\bkelurahan\s*:?\s*(.+)/i) ||
    cari(/\bdesa\s*:?\s*(.+)/i)

  hasil.kecamatan = cari(/\bkecamatan\s*:?\s*(.+)/i) || cari(/\bkec\.?\s*:?\s*(.+)/i)

  hasil.kabupaten =
    cari(/\bkab(?:upaten)?\s*\/\s*k\.?ota\s*:?\s*(.+)/i) ||
    cari(/\bkabupaten\s*:?\s*(.+)/i) ||
    cari(/\bkota\s*:?\s*(.+)/i)

  hasil.kodePos =
    cari(/\bkode\s*pos\s*:?\s*(\d{5})/i) || cari(/\bkodepos\s*:?\s*(\d{5})/i)
  if (!hasil.kodePos) {
    const kandidat = [...teksMentah.matchAll(/\b\d{5}\b/g)].map((m) => m[0])
    if (kandidat.length) hasil.kodePos = kandidat[kandidat.length - 1]
  }

  return hasil
}
