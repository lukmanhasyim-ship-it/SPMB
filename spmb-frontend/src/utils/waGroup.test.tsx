import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QRCodeSVG } from 'qrcode.react'
import { WHATSAPP_LOGO_SRC, findLinkGroupWa } from './waGroup'

const LINK = 'https://chat.whatsapp.com/G1aBcDeFgHiJkLmNoPqRsTuVwX'

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
    expect(svg).toContain('fill="#ffffff"')
    expect(svg).not.toContain('#25D366')
    expect((svg.match(/<g transform/g) || []).length).toBe(1)
    expect((svg.match(/<\/g>/g) || []).length).toBe(1)
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
        size={56}
        level="H"
        bgColor="transparent"
        fgColor="#ffffff"
        imageSettings={{ src: WHATSAPP_LOGO_SRC, width: 20, height: 20, excavate: true }}
      />
    )
    expect(withLogo).toContain('<image')
    expect(withLogo).toContain('height="56"')
    expect(withLogo).toContain('width="56"')
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
          size={56}
          level="H"
          bgColor="transparent"
          fgColor="#ffffff"
          imageSettings={{ src: WHATSAPP_LOGO_SRC, width: 20, height: 20, excavate: true }}
        />
      )
      const withoutLogo = renderToStaticMarkup(
        <QRCodeSVG value={link} size={56} level="H" bgColor="transparent" fgColor="#ffffff" />
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
        size={56}
        level="L"
        bgColor="transparent"
        fgColor="#ffffff"
      />
    )
    expect(fallback).not.toContain('<image')
  })
})