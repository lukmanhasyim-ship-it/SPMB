import html2canvas from 'html2canvas'
import { toJpeg } from 'html-to-image'

const F4_WIDTH_MM = 210
const F4_HEIGHT_MM = 330
const TARGET_DPI = 300
export const F4_PIXEL_WIDTH = Math.round((F4_WIDTH_MM / 25.4) * TARGET_DPI)
export const F4_PIXEL_HEIGHT = Math.round((F4_HEIGHT_MM / 25.4) * TARGET_DPI)
const JPEG_QUALITY = 0.92

const AREA_ID = 'area-cetak'

function waitSettle(ms = 90): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function getArea(): HTMLElement {
  const node = document.getElementById(AREA_ID)
  if (!node) throw new Error(`Elemen #${AREA_ID} tidak ditemukan`)
  return node
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img')) as HTMLImageElement[]
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve()
            return
          }
          const done = () => resolve()
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
          setTimeout(done, 5000)
        }),
    ),
  )
}

async function renderWithSnapshot(area: HTMLElement): Promise<string> {
  const cssWidth = area.offsetWidth
  return toJpeg(area, {
    pixelRatio: F4_PIXEL_WIDTH / cssWidth,
    quality: JPEG_QUALITY,
    backgroundColor: '#ffffff',
    skipFonts: true,
  })
}

async function renderWithCanvas(area: HTMLElement): Promise<string> {
  const cssWidth = area.offsetWidth
  const cssHeight = area.offsetHeight
  const canvas = await html2canvas(area, {
    width: cssWidth,
    height: cssHeight,
    scale: F4_PIXEL_WIDTH / cssWidth,
    backgroundColor: '#ffffff',
    logging: false,
  })
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

export async function renderFormJpeg(node?: HTMLElement): Promise<string> {
  const area = node ?? getArea()

  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
  if (fonts?.ready) {
    try {
      await fonts.ready
    } catch {
      // font readiness gagal tidak menghalangi proses
    }
  }
  await waitForImages(area)
  await waitSettle()

  try {
    return await renderWithSnapshot(area)
  } catch (primaryError) {
    try {
      return await renderWithCanvas(area)
    } catch (fallbackError) {
      throw new Error(
        `Gagal mengonversi formulir ke gambar (${errorMessage(primaryError)} / cadangan: ${errorMessage(fallbackError)})`,
      )
    }
  }
}

export function downloadJpeg(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function printJpeg(dataUrl: string): void {
  const existing = document.getElementById('formulir-print-frame') as HTMLIFrameElement | null
  if (existing) existing.remove()

  const iframe = document.createElement('iframe')
  iframe.id = 'formulir-print-frame'
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.setAttribute('aria-hidden', 'true')
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) {
    iframe.remove()
    throw new Error('Gagal membuat dokumen cetak')
  }

  doc.open()
  doc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page {
        size: ${F4_WIDTH_MM}mm ${F4_HEIGHT_MM}mm;
        margin: 0;
      }
      html, body {
        margin: 0;
        padding: 0;
      }
      img {
        display: block;
        width: ${F4_WIDTH_MM}mm;
        height: ${F4_HEIGHT_MM}mm;
      }
    </style>
  </head>
  <body>
    <img src="${dataUrl}" alt="Formulir Pendaftaran" />
  </body>
</html>`)
  doc.close()

  const win = iframe.contentWindow
  if (!win) {
    iframe.remove()
    throw new Error('Gagal membuka jendela cetak')
  }

  const cleanup = () => {
    win.removeEventListener('afterprint', cleanup)
    if (document.body.contains(iframe)) iframe.remove()
  }

  win.addEventListener('afterprint', cleanup)
  window.setTimeout(cleanup, 30000)
  win.focus()
  setTimeout(() => win.print(), 200)
}