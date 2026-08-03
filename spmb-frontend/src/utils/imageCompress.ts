const MAX_WIDTH = 800
const QUALITY = 0.7

export interface CompressOptions {
  maxWidth?: number
  quality?: number
}

export async function compressAndCropImage(file: File, options: CompressOptions = {}): Promise<string> {
  const maxWidth = options.maxWidth ?? MAX_WIDTH
  const quality = options.quality ?? QUALITY

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not supported')); return }

        const ratio = 4 / 5
        let srcW = img.naturalWidth
        let srcH = img.naturalHeight

        if (srcW / srcH > ratio) {
          srcW = Math.round(srcH * ratio)
        } else {
          srcH = Math.round(srcW / ratio)
        }

        const destW = Math.min(srcW, maxWidth)
        const destH = Math.round(destW / ratio)

        canvas.width = destW
        canvas.height = destH

        const sx = Math.round((img.naturalWidth - srcW) / 2)
        const sy = Math.round((img.naturalHeight - srcH) / 2)

        ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, destW, destH)

        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Gagal mengkompresi gambar')); return }
            const reader2 = new FileReader()
            reader2.onload = () => {
              const base64 = (reader2.result as string).split(',')[1]
              resolve(base64)
            }
            reader2.onerror = () => reject(reader2.error)
            reader2.readAsDataURL(blob)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Gagal memuat gambar'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
