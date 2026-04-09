'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import type { CropRect } from '@/lib/suggestCrop'

type AspectOption = 'free' | '1:1' | '3:4' | '4:5'

const ASPECT_MAP: Record<AspectOption, number | undefined> = {
  free: undefined,
  '1:1': 1,
  '3:4': 3 / 4,
  '4:5': 4 / 5,
}

interface CropEditorProps {
  imageUrl: string
  aiCrop: CropRect
  onCropChange: (crop: CropRect) => void
  onImageLoad: (el: HTMLImageElement) => void
}

function rectToCrop(rect: CropRect): PixelCrop {
  return { unit: 'px', x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

export default function CropEditor({ imageUrl, aiCrop, onCropChange, onImageLoad }: CropEditorProps) {
  const [crop, setCrop] = useState<Crop>(rectToCrop(aiCrop))
  const [aspect, setAspect] = useState<AspectOption>('3:4')
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setCrop(rectToCrop(aiCrop))
  }, [aiCrop])

  const onComplete = useCallback(
    (c: PixelCrop) => {
      onCropChange({ x: c.x, y: c.y, width: c.width, height: c.height })
    },
    [onCropChange]
  )

  const handleAspectChange = (next: AspectOption) => {
    setAspect(next)
    const aspectValue = ASPECT_MAP[next]
    if (aspectValue && imgRef.current) {
      const { width, height } = imgRef.current
      const centered = centerCrop(
        makeAspectCrop({ unit: 'px', width: crop.width ?? aiCrop.width }, aspectValue, width, height),
        width,
        height
      )
      setCrop(centered)
    }
  }

  const ASPECT_OPTIONS: AspectOption[] = ['free', '1:1', '3:4', '4:5']

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="w-full max-w-2xl">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={onComplete}
          aspect={ASPECT_MAP[aspect]}
          className="w-full rounded-xl overflow-hidden shadow-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Uploaded portrait for cropping"
            className="w-full h-auto"
            onLoad={(e) => onImageLoad(e.currentTarget)}
          />
        </ReactCrop>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1" role="group" aria-label="Aspect ratio">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleAspectChange(opt)}
              aria-pressed={aspect === opt}
              aria-label={`Aspect ratio ${opt}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                aspect === opt ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
