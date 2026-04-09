# Production UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the headshot cropper app to Canva-style production quality — DM Sans font, violet accent color, soft lavender gradient background, frosted glass header/sidebar, smooth transitions.

**Architecture:** Pure CSS/Tailwind styling changes across 5 files. No logic changes. Each task touches one file and commits. Visual "tests" are TypeScript checks + build verification.

**Tech Stack:** Next.js 16, Tailwind CSS v4, DM Sans (Google Fonts), CSS custom properties, backdrop-filter

---

## Task 1: Swap font to DM Sans and add global animation + dot-grid utilities

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Step 1: Update `app/layout.tsx`**

Replace the entire file content:

```tsx
import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import 'react-image-crop/dist/ReactCrop.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Headshot Cropper',
  description: 'AI-powered headshot cropping tool',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-dm-sans)]">{children}</body>
    </html>
  )
}
```

**Step 2: Update `app/globals.css`**

Replace the entire file content:

```css
@import "tailwindcss";

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

.canvas-dots {
  background-image: radial-gradient(circle, #ede9fe 1.5px, transparent 1.5px);
  background-size: 22px 22px;
}
```

**Step 3: Verify TypeScript**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper && npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper
git add app/layout.tsx app/globals.css
git commit -m "design: swap to DM Sans font, add fadeIn animation and canvas-dots utility"
```

---

## Task 2: Redesign `app/page.tsx` — gradient background, frosted header, sidebar, transitions

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace the entire file**

```tsx
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

const ASPECT_OPTIONS: AspectOption[] = ['free', '1:1', '3:4', '4:5']

export default function Home() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [aiCrop, setAiCrop] = useState<CropRect | null>(null)
  const [currentCrop, setCurrentCrop] = useState<CropRect | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [aspect, setAspect] = useState<AspectOption>('3:4')
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
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#f5f3ff] via-[#faf5ff] to-white">

      {/* ── Frosted glass header ── */}
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

      {/* ── Content ── */}
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
                onCropChange={setCurrentCrop}
                onImageLoad={handleEditorReady}
              />
            </div>

            {/* Frosted glass sidebar — desktop */}
            <aside className="hidden md:flex w-64 shrink-0 bg-white/70 backdrop-blur-xl border-l border-white/50 shadow-xl shadow-violet-100/20 flex-col">

              {/* Aspect ratio */}
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

              {/* Actions */}
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

              {/* Spacer + hint */}
              <div className="mt-auto px-5 pb-5">
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
```

**Step 2: Verify TypeScript**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper
git add app/page.tsx
git commit -m "design: violet gradient, frosted header/sidebar, fadeIn transitions"
```

---

## Task 3: Redesign `components/UploadZone.tsx`

**Files:**
- Modify: `components/UploadZone.tsx`

**Step 1: Replace the entire file**

```tsx
'use client'

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

interface UploadZoneProps {
  onFileSelected: (file: File) => void
}

export default function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Only JPEG, PNG, and WebP images are supported.'
    if (file.size > MAX_SIZE_BYTES) return `File must be under ${MAX_SIZE_MB} MB.`
    return null
  }, [])

  const handleFile = useCallback((file: File) => {
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    onFileSelected(file)
  }, [validate, onFileSelected])

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() }
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload photo — drag and drop or click to select"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onKeyDown={onKeyDown}
        onClick={() => inputRef.current?.click()}
        className={`w-full rounded-3xl border-2 border-dashed py-10 px-6 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 select-none ${
          dragging
            ? 'border-violet-500 bg-violet-100/60 scale-[1.01]'
            : 'border-violet-200 bg-violet-50/50 hover:border-violet-400 hover:bg-violet-50'
        }`}
      >
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
          dragging
            ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/40'
            : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/25'
        }`}>
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">
            Drop your photo here, or{' '}
            <span className="text-violet-600 underline underline-offset-2 decoration-violet-300">browse files</span>
          </p>
          <p className="text-xs text-gray-400 mt-1.5">JPEG, PNG, WebP · max {MAX_SIZE_MB} MB</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={onChange}
        className="hidden"
        aria-hidden="true"
      />

      {error && (
        <p role="alert" className="text-xs font-medium text-red-500 text-center bg-red-50 px-3 py-2 rounded-xl border border-red-100">
          {error}
        </p>
      )}
    </div>
  )
}
```

**Step 2: Verify TypeScript**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper
git add components/UploadZone.tsx
git commit -m "design: violet gradient upload zone with frosted error styling"
```

---

## Task 4: Update `components/CropEditor.tsx` — image shadow

**Files:**
- Modify: `components/CropEditor.tsx`

Only the image needs richer shadow. The coordinate logic stays untouched.

**Step 1: Update the image style**

Find this block in `components/CropEditor.tsx`:

```tsx
      <ReactCrop
        crop={crop}
        onChange={(c) => setCrop(c)}
        onComplete={onComplete}
        aspect={ASPECT_MAP[aspect]}
        className="rounded-lg overflow-hidden shadow-md"
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
```

Replace with:

```tsx
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
```

**Step 2: Verify TypeScript**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper
git add components/CropEditor.tsx
git commit -m "design: richer shadow on crop image"
```

---

## Task 5: Update `components/Toast.tsx` — violet success, keep red error

**Files:**
- Modify: `components/Toast.tsx`

**Step 1: Replace the entire file**

```tsx
'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onDismiss: () => void
}

export default function Toast({ message, type = 'success', onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl text-white text-xs font-semibold shadow-xl transition-all duration-300 ${
        type === 'success'
          ? 'bg-gradient-to-r from-violet-600 to-purple-600 shadow-violet-500/30'
          : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30'
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {type === 'success' ? (
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
      {message}
    </div>
  )
}
```

**Step 2: Verify TypeScript**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper
git add components/Toast.tsx
git commit -m "design: violet gradient success toast, red gradient error toast"
```

---

## Task 6: Final build verification

**Step 1: Run full test suite**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper && npm test
```

Expected: all tests PASS (logic unchanged).

**Step 2: Production build**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper && npm run build
```

Expected: build succeeds with no errors.

**Step 3: Commit if any fixes were needed, otherwise done**

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper
git add -A
git commit -m "chore: verify production build after UI redesign"
```

---

## Done

The app now has:
- DM Sans font throughout
- Soft lavender-to-white gradient page background
- Violet-600 accent color on all interactive elements
- Frosted glass header, sidebar, and mobile bottom bar
- Violet gradient upload zone with drag-over animation
- `canvas-dots` dot-grid pattern on the editor canvas
- `animate-fadeIn` phase transitions
- Violet gradient success toast, red gradient error toast
- `shadow-2xl` on the crop image
