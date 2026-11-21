import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'

export interface PreviewScaleOptions {
  /** Lebar alami konten dalam css px (mis. 210mm -> ~794px). */
  widthPx: number
  /** Tinggi alami konten dalam css px. Dipakai untuk menyediakan ruang layout. */
  heightPx: number
  /** Skala maksimum; 1 berarti tidak pernah memperbesar. */
  max?: number
}

export interface PreviewScaleResult {
  containerRef: RefObject<HTMLDivElement>
  scale: number
  /** Wrapper penyangga: mengunci tinggi layout sesuai ukuran hasil skalanya. */
  frameStyle: CSSProperties
  /** Konten berskala: ukuran asli tetap dipertahankan supaya cetak tidak berubah. */
  contentStyle: CSSProperties
}

/**
 * Mengecilkan pratinjau berukuran tetap (A4/kartu) agar muat di kontainer.
 *
 * Konten tidak diubah ukuran aslinya -- hanya di-`transform: scale` -- sehingga
 * area cetak yang memakai ukuran mm tetap identik dengan hasil printer. `frameStyle`
 * menyediakan ruang sebesar hasil skala supaya tidak ada spasi kosong besar di
 * bawah pratinjau.
 */
export function usePreviewScale({
  widthPx,
  heightPx,
  max = 1,
}: PreviewScaleOptions): PreviewScaleResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(max)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const available = container.clientWidth
      setScale(available > 0 ? Math.min(max, available / widthPx) : max)
    }

    measure()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure)
      observer.observe(container)
      return () => observer.disconnect()
    }

    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [widthPx, max])

  return {
    containerRef,
    scale,
    frameStyle: {
      width: widthPx * scale,
      height: heightPx * scale,
    },
    contentStyle: {
      width: widthPx,
      height: heightPx,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
    },
  }
}
