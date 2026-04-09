export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

const ASPECT_RATIO = 3 / 4 // width:height

/**
 * Returns a deterministic headshot crop rectangle.
 * Places a 3:4 crop centered horizontally in the upper third of the image.
 */
export function heuristicCrop(imageWidth: number, imageHeight: number): CropRect {
  let cropWidth = Math.round(imageWidth * 0.6)
  let cropHeight = Math.round(cropWidth / ASPECT_RATIO)

  if (cropHeight > imageHeight) {
    cropHeight = imageHeight
    cropWidth = Math.round(cropHeight * ASPECT_RATIO)
  }

  const x = Math.round((imageWidth - cropWidth) / 2)
  const y = Math.round(imageHeight * 0.1)
  const clampedY = Math.min(y, imageHeight - cropHeight)

  return { x, y: Math.max(0, clampedY), width: cropWidth, height: cropHeight }
}

/**
 * Runs face-api.js detection on an img element.
 * Falls back to heuristicCrop if no face is found or detection fails.
 * Must only be called in browser context.
 */
export async function suggestCrop(
  imgEl: HTMLImageElement,
  imageWidth: number,
  imageHeight: number,
  modelUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
): Promise<CropRect> {
  try {
    const faceapi = await import('face-api.js')
    if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
      await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl)
    }
    const detection = await faceapi.detectSingleFace(imgEl)
    if (!detection) return heuristicCrop(imageWidth, imageHeight)

    const { box } = detection
    const cropWidth = Math.round(box.width * 1.6)
    const cropHeight = Math.round(cropWidth / ASPECT_RATIO)
    const x = Math.max(0, Math.round(box.x + box.width / 2 - cropWidth / 2))
    const y = Math.max(0, Math.round(box.y - cropHeight * 0.15))

    const clampedX = Math.min(x, imageWidth - cropWidth)
    const clampedY = Math.min(y, imageHeight - cropHeight)

    if (cropWidth <= 0 || cropHeight <= 0) return heuristicCrop(imageWidth, imageHeight)

    return {
      x: Math.max(0, clampedX),
      y: Math.max(0, clampedY),
      width: cropWidth,
      height: cropHeight,
    }
  } catch {
    return heuristicCrop(imageWidth, imageHeight)
  }
}
