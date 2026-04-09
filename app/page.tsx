'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import UploadZone from '@/components/UploadZone'
import Toast from '@/components/Toast'
import type { CropRect } from '@/lib/suggestCrop'
import { exportCroppedImage } from '@/lib/exportImage'
import type { AspectOption } from '@/components/CropEditor'

const CropEditor = dynamic(() => import('@/components/CropEditor'), { ssr: false })

type Phase = 'idle' | 'detecting' | 'cropping' | 'exporting'
interface ToastState { message: string; type: 'success' | 'error' }

const ASPECT_OPTIONS: AspectOption[] = ['free', '1:1', '3:4', '4:5']

export default function Home() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [aiCrop, setAiCrop] = useState<CropRect | null>(null)
  const [currentCrop, setCurrentCrop] = useState<CropRect | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [aspect, setAspect] = useState<AspectOption>('3:4')
  const [resetKey, setResetKey] = useState(0)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const handleFileSelected = useCallback((file: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(URL.createObjectURL(file))
    setPhase('detecting')
  }, [imageUrl])

  const handleDetect = useCallback(async (el: HTMLImageElement) => {
    const { naturalWidth: w, naturalHeight: h } = el
    const { suggestCrop } = await import('@/lib/suggestCrop')
    const crop = await suggestCrop(el, w, h)
    setAiCrop(crop)
    setCurrentCrop(crop)
    setPhase('cropping')
  }, [])

  const handleEditorReady = useCallback((el: HTMLImageElement) => {
    imgRef.current = el
  }, [])

  const handleReset = useCallback(() => {
    if (aiCrop) {
      setCurrentCrop(aiCrop)
      setResetKey(k => k + 1)
    }
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

  const handleNew = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setAiCrop(null)
    setCurrentCrop(null)
    setPhase('idle')
  }, [imageUrl])

  const isCropping = phase === 'cropping' || phase === 'exporting'

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f3ff] via-[#faf5ff] to-white">

      {/* Frosted glass header */}
      <header className="h-14 shrink-0 bg-white/80 backdrop-blur-md border-b border-white/60 shadow-sm flex items-center justify-between px-4 sm:px-6 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">Headshot Cropper</span>
        </div>

        {isCropping && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="hidden sm:block text-xs font-medium text-gray-500 hover:text-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-all duration-200"
            >
              Reset crop
            </button>
            <button
              onClick={handleNew}
              className="text-xs font-medium text-gray-500 hover:text-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-all duration-200"
            >
              New photo
            </button>
            <button
              onClick={handleExport}
              disabled={phase === 'exporting'}
              className={`text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-4 py-1.5 rounded-lg shadow-md shadow-violet-500/25 transition-all duration-200 disabled:opacity-60 ${phase === 'exporting' ? 'animate-pulse' : ''}`}
            >
              {phase === 'exporting' ? 'Exporting…' : 'Export'}
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">

        {/* Upload state */}
        {phase === 'idle' && (
          <div key="idle" className="flex-1 flex flex-col items-center justify-center gap-8 px-4 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Upload your photo</h2>
              <p className="text-sm text-gray-500 mt-2">AI detects the face and suggests the perfect headshot crop</p>
            </div>
            <div className="w-full max-w-sm">
              <UploadZone onFileSelected={handleFileSelected} />
            </div>
          </div>
        )}

        {/* Detecting state */}
        {phase === 'detecting' && imageUrl && (
          <div key="detecting" className="flex-1 flex items-center justify-center animate-fadeIn">
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Uploaded portrait"
                  className="rounded-2xl opacity-40"
                  style={{ maxHeight: '52vh', maxWidth: 'min(90vw, 360px)', width: 'auto' }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-600 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                    Detecting face…
                  </span>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" aria-hidden="true" className="hidden" onLoad={(e) => handleDetect(e.currentTarget)} />
            </div>
          </div>
        )}

        {/* Cropping state */}
        {isCropping && imageUrl && aiCrop && currentCrop && (
          <>
            {/* Canvas */}
            <div key="canvas" className="flex-1 bg-[#f8f7ff] canvas-dots flex items-center justify-center overflow-hidden p-6 sm:p-10 animate-fadeIn">
              <CropEditor
                imageUrl={imageUrl}
                aiCrop={aiCrop}
                aspect={aspect}
                resetKey={resetKey}
                onCropChange={setCurrentCrop}
                onImageLoad={handleEditorReady}
              />
            </div>

            {/* Frosted glass sidebar — desktop */}
            <aside className="hidden md:flex w-64 shrink-0 bg-white/70 backdrop-blur-xl border-l border-white/50 shadow-xl shadow-violet-100/20 flex-col">
              <div className="px-5 py-5 border-b border-violet-50">
                <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-widest mb-3">Aspect Ratio</p>
                <div className="grid grid-cols-2 gap-2">
                  {ASPECT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAspect(opt)}
                      aria-pressed={aspect === opt}
                      className={`text-xs font-semibold rounded-xl py-2.5 transition-all duration-200 ${
                        aspect === opt
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30 scale-[1.02]'
                          : 'border border-violet-100 text-gray-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50'
                      }`}
                    >
                      {opt === 'free' ? 'Free' : opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-5 py-5 flex flex-col gap-2.5">
                <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-widest mb-1">Actions</p>
                <button
                  onClick={handleReset}
                  aria-label="Reset crop to AI suggestion"
                  className="w-full text-xs font-semibold text-violet-600 border border-violet-200 rounded-xl py-2.5 hover:bg-violet-50 hover:border-violet-400 transition-all duration-200"
                >
                  Reset to AI Suggestion
                </button>
              </div>

              <div className="mt-auto px-5 pb-6">
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  Drag handles to adjust.<br />Export saves a full-resolution JPEG.
                </p>
              </div>
            </aside>

            {/* Frosted glass bottom bar — mobile */}
            <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-lg px-4 pt-3 pb-5 flex flex-col gap-2.5 z-10">
              <div className="flex items-center gap-1.5">
                {ASPECT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAspect(opt)}
                    className={`flex-1 text-xs font-semibold rounded-xl py-2 transition-all duration-200 ${
                      aspect === opt
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                        : 'border border-violet-100 text-gray-500 hover:border-violet-300 hover:text-violet-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-violet-600 border border-violet-200 rounded-xl px-4 py-2.5 hover:bg-violet-50 transition-all duration-200"
                >
                  Reset
                </button>
                <button
                  onClick={handleExport}
                  disabled={phase === 'exporting'}
                  className={`flex-1 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl py-2.5 shadow-md shadow-violet-500/25 transition-all duration-200 disabled:opacity-60 ${phase === 'exporting' ? 'animate-pulse' : ''}`}
                >
                  {phase === 'exporting' ? 'Exporting…' : 'Export'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}
