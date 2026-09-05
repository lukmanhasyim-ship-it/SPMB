import { toJpeg } from 'html-to-image'

const F4_WIDTH_MM = 210
const F4_HEIGHT_MM = 330
const TARGET_DPI = 300
export const F4_PIXEL_WIDTH = Math.round((F4_WIDTH_MM / 25.4) * TARGET_DPI)
export const F4_PIXEL_HEIGHT = Math.round((F4_HEIGHT_MM / 25.4) * TARGET_DPI)
const JPEG_QUALITY = 0.92

const AREA_ID = 'area-cetak'

function waitSettle(ms = 80): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getArea(): HTMLElement {
  const node = document.getElementById(AREA_ID)
  if (!node) throw new Error(`Elemen #${AREA_ID} tidak ditemukan`)
  return node
}

export async function renderFormJpeg(node?: HTMLElement): Promise<string> {
  const area = node ?? getArea()
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
  if (fonts?.ready) await fonts.ready
  await waitSettle()

  const cssWidth = area.offsetWidth
  if (cssWidth <= 0) throw new Error('Lebar area cetak tidak valid')
  const pixelRatio = F4_PIXEL_WIDTH / cssWidth

  return toJpeg(area, {
    pixelRatio,
    quality: JPEG_QUALITY,
    backgroundColor: '#ffffff',
    skipFonts: true,
    cacheBust: true,
  })
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
  window.setTimeout(cleanup, 60000)
  win.focus()
  setTimeout(() => win.print(), 150)
}