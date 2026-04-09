import type { CropRect } from './suggestCrop'

export function validateCrop(crop: CropRect): boolean {
  return crop.width > 0 && crop.height > 0
}

export async function exportCroppedImage(
  imgEl: HTMLImageElement,
  crop: CropRect,
  filename = 'headshot.jpg'
): Promise<void> {
  if (!validateCrop(crop)) throw new Error('Invalid crop dimensions')

  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  ctx.drawImage(imgEl, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Failed to create image blob'))
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        resolve()
      },
      'image/jpeg',
      0.95
    )
  })
}
