'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import UploadZone from '@/components/UploadZone'
import Toast from '@/components/Toast'
import type { CropRect } from '@/lib/suggestCrop'
import { exportCroppedImage } from '@/lib/exportImage'

// Dynamically import CropEditor to avoid SSR issues with react-image-crop
const CropEditor = dynamic(() => import('@/components/CropEditor'), { ssr: false })

type Phase = 'idle' | 'detecting' | 'cropping' | 'exporting'

interface ToastState {
  message: string
  type: 'success' | 'error'
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [aiCrop, setAiCrop] = useState<CropRect | null>(null)
  const [currentCrop, setCurrentCrop] = useState<CropRect | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const handleFileSelected = useCallback(async (file: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setPhase('detecting')
  }, [imageUrl])

  const handleImageLoad = useCallback(async (el: HTMLImageElement) => {
    imgRef.current = el
    const { naturalWidth: w, naturalHeight: h } = el
    const { suggestCrop } = await import('@/lib/suggestCrop')
    const crop = await suggestCrop(el, w, h)
    setAiCrop(crop)
    setCurrentCrop(crop)
    setPhase('cropping')
  }, [])

  const handleReset = useCallback(() => {
    if (aiCrop) setCurrentCrop(aiCrop)
  }, [aiCrop])

  const handleExport = useCallback(async () => {
    if (!imgRef.current || !currentCrop) return
    setPhase('exporting')
    try {
      await exportCroppedImage(imgRef.current, currentCrop)
      setToast({ message: 'Image exported successfully', type: 'success' })
    } catch {
      setToast({ message: 'Export failed. Please try again.', type: 'error' })
    } finally {
      setPhase('cropping')
    }
  }, [currentCrop])

  const handleUploadAnother = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setAiCrop(null)
    setCurrentCrop(null)
    setPhase('idle')
  }, [imageUrl])

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8 sm:py-12 px-0 sm:px-4">
      {/* Card: full-width + no radius on mobile, contained card on sm+ */}
      <div className="w-full sm:max-w-lg md:max-w-xl bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 flex flex-col items-center gap-8 px-6 py-8 sm:px-8 sm:py-10">

        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Headshot Cropper</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">AI-suggested crop · adjust · export</p>
        </div>

        {phase === 'idle' && (
          <UploadZone onFileSelected={handleFileSelected} />
        )}

        {phase === 'detecting' && imageUrl && (
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Uploaded portrait" className="w-full h-auto rounded-xl shadow-sm opacity-60" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/60">
              <svg className="w-8 h-8 text-gray-600 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">Analyzing face…</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              aria-hidden="true"
              className="hidden"
              onLoad={(e) => handleImageLoad(e.currentTarget)}
            />
          </div>
        )}

        {(phase === 'cropping' || phase === 'exporting') && imageUrl && aiCrop && currentCrop && (
          <>
            <CropEditor
              imageUrl={imageUrl}
              aiCrop={aiCrop}
              onCropChange={setCurrentCrop}
              onImageLoad={handleImageLoad}
            />
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                onClick={handleReset}
                aria-label="Reset crop to AI suggestion"
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset to AI Suggestion
              </button>
              <button
                onClick={handleExport}
                disabled={phase === 'exporting'}
                aria-label="Export cropped image as JPEG"
                className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {phase === 'exporting' ? 'Exporting…' : 'Export Cropped Image'}
              </button>
              <button
                onClick={handleUploadAnother}
                aria-label="Upload a different photo"
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                Upload another
              </button>
            </div>
          </>
        )}

      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </main>
  )
}
