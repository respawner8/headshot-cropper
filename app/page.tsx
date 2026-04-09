'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import UploadZone from '@/components/UploadZone'
import Toast from '@/components/Toast'
import type { CropRect } from '@/lib/suggestCrop'
import { exportCroppedImage } from '@/lib/exportImage'
import type { AspectOption } from '@/components/CropEditor'
import { ASPECT_MAP } from '@/components/CropEditor'

const CropEditor = dynamic(() => import('@/components/CropEditor'), { ssr: false })

type Phase = 'idle' | 'detecting' | 'cropping' | 'exporting'
interface ToastState { message: string; type: 'success' | 'error' }

export default function Home() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [aiCrop, setAiCrop] = useState<CropRect | null>(null)
  const [currentCrop, setCurrentCrop] = useState<CropRect | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [aspect, setAspect] = useState<AspectOption>('3:4')
  const imgRef = useRef<HTMLImageElement | null>(null)

  const ASPECT_OPTIONS: AspectOption[] = ['free', '1:1', '3:4', '4:5']

  const handleFileSelected = useCallback((file: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(URL.createObjectURL(file))
    setPhase('detecting')
  }, [imageUrl])

  // Called from the hidden <img> in detecting state — runs face detection
  const handleDetect = useCallback(async (el: HTMLImageElement) => {
    const { naturalWidth: w, naturalHeight: h } = el
    const { suggestCrop } = await import('@/lib/suggestCrop')
    const crop = await suggestCrop(el, w, h)
    setAiCrop(crop)
    setCurrentCrop(crop)
    setPhase('cropping')
  }, [])

  // Called from CropEditor when its <img> loads — just stores the ref for export
  const handleEditorReady = useCallback((el: HTMLImageElement) => {
    imgRef.current = el
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

  const handleNew = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setAiCrop(null)
    setCurrentCrop(null)
    setPhase('idle')
  }, [imageUrl])

  const isCropping = phase === 'cropping' || phase === 'exporting'

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">

      {/* ── Top bar ── */}
      <header className="h-13 shrink-0 bg-white border-b border-gray-150 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">Headshot Cropper</span>
        </div>

        {isCropping && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="hidden sm:block text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              Reset crop
            </button>
            <button
              onClick={handleNew}
              className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              New photo
            </button>
            <button
              onClick={handleExport}
              disabled={phase === 'exporting'}
              className="text-xs font-semibold text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-50 px-4 py-1.5 rounded-md transition-colors"
            >
              {phase === 'exporting' ? 'Exporting…' : 'Export'}
            </button>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Upload state */}
        {phase === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 bg-gray-50">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">Upload a portrait photo</h2>
              <p className="text-sm text-gray-500 mt-1">AI will detect the face and suggest the best headshot crop</p>
            </div>
            <div className="w-full max-w-sm">
              <UploadZone onFileSelected={handleFileSelected} />
            </div>
          </div>
        )}

        {/* Detecting state */}
        {phase === 'detecting' && imageUrl && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Uploaded portrait"
                  className="rounded-xl shadow-sm opacity-40"
                  style={{ maxHeight: '52vh', maxWidth: 'min(90vw, 360px)', width: 'auto' }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl">
                  <svg className="w-6 h-6 text-gray-700 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <p className="text-xs font-medium text-gray-700 bg-white/80 px-2 py-1 rounded-full">Detecting face…</p>
                </div>
              </div>
              {/* Hidden img triggers face detection */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" aria-hidden="true" className="hidden" onLoad={(e) => handleDetect(e.currentTarget)} />
            </div>
          </div>
        )}

        {/* Cropping state: canvas + sidebar */}
        {isCropping && imageUrl && aiCrop && currentCrop && (
          <>
            {/* Canvas */}
            <div className="flex-1 bg-[#f0f0f0] flex items-center justify-center overflow-hidden p-4 sm:p-8">
              <CropEditor
                imageUrl={imageUrl}
                aiCrop={aiCrop}
                aspect={aspect}
                onCropChange={setCurrentCrop}
                onImageLoad={handleEditorReady}
              />
            </div>

            {/* Sidebar — desktop */}
            <aside className="hidden md:flex w-60 shrink-0 bg-white border-l border-gray-200 flex-col">
              <div className="px-5 py-5 border-b border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Aspect Ratio</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ASPECT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAspect(opt)}
                      aria-pressed={aspect === opt}
                      className={`text-xs font-medium rounded-lg py-2 transition-colors ${
                        aspect === opt
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-5 py-4 flex flex-col gap-2">
                <button
                  onClick={handleReset}
                  className="w-full text-xs font-medium text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
                >
                  Reset to AI Suggestion
                </button>
              </div>
            </aside>

            {/* Bottom bar — mobile */}
            <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 pt-3 pb-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5">
                {ASPECT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAspect(opt)}
                    className={`flex-1 text-xs font-medium rounded-lg py-1.5 transition-colors ${
                      aspect === opt
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleReset} className="text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-2">
                  Reset
                </button>
                <button
                  onClick={handleExport}
                  disabled={phase === 'exporting'}
                  className="flex-1 text-xs font-semibold text-white bg-gray-900 rounded-lg py-2 hover:bg-gray-700 disabled:opacity-50"
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

