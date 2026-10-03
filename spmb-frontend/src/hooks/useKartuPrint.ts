import { useCallback, useEffect, useState } from 'react'

export type KartuPrintMode = 'kartu' | 'a4'

/**
 * Menahan area cetak tetap ter-mount sampai dialog cetak ditutup.
 *
 * Area cetak sengaja hanya di-render ketika mode !== null supaya tidak muncul
 * ganda di layar dan supaya @page dari style cetak ikut terpasang tepat waktu.
 */
export function useKartuPrint() {
  const [mode, setMode] = useState<KartuPrintMode | null>(null)

  useEffect(() => {
    if (!mode) return

    const clear = () => setMode(null)
    window.addEventListener('afterprint', clear)
    // Jaring pengaman bila afterprint tidak dipanggil browser.
    const fallback = window.setTimeout(clear, 5 * 60 * 1000)

    return () => {
      window.removeEventListener('afterprint', clear)
      window.clearTimeout(fallback)
    }
  }, [mode])

  const print = useCallback((next: KartuPrintMode) => {
    setMode(next)
    // Tunggu dua frame supaya area cetak benar-benar ter-paint sebelum dialog dibuka.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print())
    })
  }, [])

  return { mode, print }
}
