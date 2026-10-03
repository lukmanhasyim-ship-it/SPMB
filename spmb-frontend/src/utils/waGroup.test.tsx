import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QRCodeSVG } from 'qrcode.react'
import { WHATSAPP_LOGO_SRC, QR_MODULE_COLOR, findLinkGroupWa } from './waGroup'

const LINK = 'https://chat.whatsapp.com/G1aBcDeFgHiJkLmNoPqRsTuVwX'

/** Geometri yang benar-benar dipakai kartu, bukan angka lama. */
const QR_SIZE_PX = 83
const QR_LOGO_PX = 24

function countModules(html: string): number {
  return (html.match(/h1v1/g) || []).length
}

describe('waGroup', () => {
  it('WHATSAPP_LOGO_SRC adalah data URI SVG yang valid', () => {
    expect(WHATSAPP_LOGO_SRC.startsWith('data:image/svg+xml,')).toBe(true)
    const svg = decodeURIComponent(WHATSAPP_LOGO_SRC.replace('data:image/svg+xml,', ''))
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.endsWith('</svg>')).toBe(true)
    expect(svg).toContain('viewBox="0 0 24 24"')
    // Glyph harus senada dengan modul QR, bukan putih, agar tidak hilang di
    // lubang putih hasil excavation.
    expect(svg).toContain(`fill="${QR_MODULE_COLOR}"`)
    expect(svg).not.toContain('fill="#ffffff"')
    expect(svg).not.toContain('#25D366')
    expect((svg.match(/<g transform/g) || []).length).toBe(1)
    expect((svg.match(/<\/g>/g) || []).length).toBe(1)
  })

  it('glyph WhatsApp dipusatkan di dalam viewBox', () => {
    const svg = decodeURIComponent(WHATSAPP_LOGO_SRC.replace('data:image/svg+xml,', ''))
    const scale = 0.6
    expect(svg).toContain(`scale(${scale})`)
    const offset = (24 - 24 * scale) / 2
    const written = svg.match(/translate\(([\d.]+) ([\d.]+)\)/)
    expect(written).not.toBeNull()
    expect(Number(written![1])).toBeCloseTo(offset, 5)
    expect(Number(written![2])).toBeCloseTo(offset, 5)
  })

  it('findLinkGroupWa mencocokkan link per gelombang', () => {
    const rows = [
      { gelombang: 'Gelombang 1', link_group_wa: 'https://chat.whatsapp.com/G1' },
      { gelombang: 'Gelombang 2', link_group_wa: '  ' },
      { gelombang: 'Gelombang 3', link_group_wa: 'https://chat.whatsapp.com/G3' },
    ]
    expect(findLinkGroupWa(rows, 'Gelombang 1')).toBe('https://chat.whatsapp.com/G1')
    expect(findLinkGroupWa(rows, 'Gelombang 3')).toBe('https://chat.whatsapp.com/G3')
    expect(findLinkGroupWa(rows, 'Gelombang 2')).toBe('')
    expect(findLinkGroupWa(rows, 'Inden')).toBe('')
    expect(findLinkGroupWa(rows, '')).toBe('')
  })

  it('QR header menyisipkan logo WhatsApp', () => {
    const withLogo = renderToStaticMarkup(
      <QRCodeSVG
        value={LINK}
        size={QR_SIZE_PX}
        level="H"
        bgColor="transparent"
        fgColor={QR_MODULE_COLOR}
        imageSettings={{ src: WHATSAPP_LOGO_SRC, width: QR_LOGO_PX, height: QR_LOGO_PX, excavate: true }}
      />
    )
    expect(withLogo).toContain('<image')
    expect(withLogo).toContain(`height="${QR_SIZE_PX}"`)
    expect(withLogo).toContain(`width="${QR_SIZE_PX}"`)
  })

  it('excavation tetap di bawah 30% (level H) untuk link pendek maupun panjang', () => {
    const links = [
      'https://chat.whatsapp.com/G1',
      'https://chat.whatsapp.com/G1aBcDeFgHiJkLmNoPqRsTuVwX',
      'https://chat.whatsapp.com/G1aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789',
    ]

    for (const link of links) {
      const withLogo = renderToStaticMarkup(
        <QRCodeSVG
          value={link}
          size={QR_SIZE_PX}
          level="H"
          bgColor="transparent"
          fgColor={QR_MODULE_COLOR}
          imageSettings={{ src: WHATSAPP_LOGO_SRC, width: QR_LOGO_PX, height: QR_LOGO_PX, excavate: true }}
        />
      )
      const withoutLogo = renderToStaticMarkup(
        <QRCodeSVG value={link} size={QR_SIZE_PX} level="H" bgColor="transparent" fgColor={QR_MODULE_COLOR} />
      )

      const total = countModules(withoutLogo)
      const excavated = (total - countModules(withLogo)) / total
      // margin error correction level H = 30%
      expect(excavated).toBeLessThanOrEqual(0.3)
      expect(excavated).toBeGreaterThan(0.05)
    }
  })

  it('fallback tanpa link WA tidak menyisipkan logo dan tetap memakai level L', () => {
    const fallback = renderToStaticMarkup(
      <QRCodeSVG
        value="SPMB-2026-0001"
        size={QR_SIZE_PX}
        level="L"
        bgColor="transparent"
        fgColor={QR_MODULE_COLOR}
      />
    )
    expect(fallback).not.toContain('<image')
  })
})