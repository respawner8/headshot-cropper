'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import type { CropRect } from '@/lib/suggestCrop'

export type AspectOption = 'free' | '1:1' | '3:4' | '4:5'

export const ASPECT_MAP: Record<AspectOption, number | undefined> = {
  free: undefined,
  '1:1': 1,
  '3:4': 3 / 4,
  '4:5': 4 / 5,
}

interface CropEditorProps {
  imageUrl: string
  aiCrop: CropRect           // natural pixel coordinates
  aspect: AspectOption
  resetKey: number           // increment to force crop back to aiCrop
  onCropChange: (crop: CropRect) => void  // reports natural pixel coordinates
  onImageLoad: (el: HTMLImageElement) => void
}

/** Convert natural pixel rect to displayed pixel rect */
function toDisplay(rect: CropRect, img: HTMLImageElement): PixelCrop {
  const sx = img.width / img.naturalWidth
  const sy = img.height / img.naturalHeight
  return { unit: 'px', x: rect.x * sx, y: rect.y * sy, width: rect.width * sx, height: rect.height * sy }
}

export default function CropEditor({ imageUrl, aiCrop, aspect, resetKey, onCropChange, onImageLoad }: CropEditorProps) {
  const [crop, setCrop] = useState<Crop>({ unit: 'px', x: 0, y: 0, width: 0, height: 0 })
  const imgRef = useRef<HTMLImageElement>(null)

  // When the visible image loads: convert aiCrop to displayed coords and notify parent
  const handleImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setCrop(toDisplay(aiCrop, img))
    onImageLoad(img)
  }, [aiCrop, onImageLoad])

  // Sync displayed crop when reset is triggered (resetKey increments) or aiCrop changes
  useEffect(() => {
    const img = imgRef.current
    if (!img || img.width === 0) return
    setCrop(toDisplay(aiCrop, img))
  }, [aiCrop, resetKey])

  // Report crop changes back in natural pixel coordinates
  const onComplete = useCallback((c: PixelCrop) => {
    const img = imgRef.current
    if (!img || img.width === 0) return
    const sx = img.naturalWidth / img.width
    const sy = img.naturalHeight / img.height
    onCropChange({
      x: Math.round(c.x * sx),
      y: Math.round(c.y * sy),
      width: Math.round(c.width * sx),
      height: Math.round(c.height * sy),
    })
  }, [onCropChange])

  // Re-center crop when aspect ratio changes
  useEffect(() => {
    const img = imgRef.current
    if (!img || img.width === 0) return
    const aspectValue = ASPECT_MAP[aspect]
    if (!aspectValue) return
    const centered = centerCrop(
      makeAspectCrop({ unit: 'px', width: crop.width || img.width * 0.6 }, aspectValue, img.width, img.height),
      img.width,
      img.height
    )
    setCrop(centered)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect])

  return (
    <div className="flex items-center justify-center w-full h-full">
      <ReactCrop
        crop={crop}
        onChange={(c) => setCrop(c)}
        onComplete={onComplete}
        aspect={ASPECT_MAP[aspect]}
        className="rounded-2xl overflow-hidden shadow-2xl shadow-black/25"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Uploaded portrait for cropping"
          style={{ maxHeight: 'min(62vh, 580px)', maxWidth: 'min(100%, 560px)', width: 'auto', display: 'block' }}
          onLoad={handleImgLoad}
        />
      </ReactCrop>
    </div>
  )
}
