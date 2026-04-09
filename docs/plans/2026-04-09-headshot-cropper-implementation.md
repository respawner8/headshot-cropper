# Headshot Cropper Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-page Next.js app where users upload a portrait photo, receive an AI face-detection crop suggestion, interactively adjust it, and export the result.

**Architecture:** Single `app/page.tsx` manages a `phase` state machine (`idle → detecting → cropping → done`). All components are client-side. face-api.js runs face detection with a heuristic fallback; react-image-crop handles the interactive overlay.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, react-image-crop, face-api.js

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: entire project at `/Users/nikhilanand/Desktop/Dev/headshot-cropper`

**Step 1: Run create-next-app inside the existing directory**

The git repo already exists at `/Users/nikhilanand/Desktop/Dev/headshot-cropper`. Scaffold into the current directory:

```bash
cd /Users/nikhilanand/Desktop/Dev/headshot-cropper
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-turbopack
```

When prompted, accept all defaults.

**Step 2: Verify it runs**

```bash
npm run dev
```

Visit http://localhost:3000. Expected: default Next.js welcome page.

**Step 3: Clean boilerplate**

Delete the default page content. Replace `app/page.tsx` with:

```tsx
export default function Home() {
  return <main className="min-h-screen bg-white" />
}
```

Replace `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Delete `public/next.svg` and `public/vercel.svg`.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 project with TypeScript and Tailwind"
```

---

## Task 2: Install dependencies

**Step 1: Install libraries**

```bash
npm install react-image-crop face-api.js
npm install --save-dev @types/react-image-crop
```

Note: `react-image-crop` ships its own types; `@types/react-image-crop` may not exist — skip if install fails.

**Step 2: Verify imports resolve**

Create a temporary file `lib/test-imports.ts`:

```ts
import 'react-image-crop'
// face-api.js is imported dynamically at runtime — no static import needed here
export {}
```

Run `npx tsc --noEmit`. Expected: no errors. Delete `lib/test-imports.ts` after.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add react-image-crop and face-api.js dependencies"
```

---

## Task 3: Set up Jest for unit testing

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

**Step 1: Install Jest deps**

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest @types/jest
```

**Step 2: Create `jest.config.ts`**

```ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

**Step 3: Create `jest.setup.ts`**

```ts
import '@testing-library/jest-dom'
```

**Step 4: Add test script to `package.json`**

In the `"scripts"` section, add:

```json
"test": "jest",
"test:watch": "jest --watch"
```

**Step 5: Verify Jest works**

Create `lib/__tests__/smoke.test.ts`:

```ts
test('jest works', () => {
  expect(1 + 1).toBe(2)
})
```

Run: `npm test`
Expected: PASS

Delete `lib/__tests__/smoke.test.ts` after.

**Step 6: Commit**

```bash
git add jest.config.ts jest.setup.ts package.json package-lock.json
git commit -m "chore: set up Jest with jsdom and React Testing Library"
```

---

## Task 4: Build `suggestCrop.ts` — heuristic function (TDD)

**Files:**
- Create: `lib/suggestCrop.ts`
- Create: `lib/__tests__/suggestCrop.test.ts`

This is a pure function — perfect for TDD. The face-api.js path is wired here too but only the heuristic is unit-tested (face detection requires a browser + model).

**Step 1: Write the failing tests**

Create `lib/__tests__/suggestCrop.test.ts`:

```ts
import { heuristicCrop } from '../suggestCrop'

describe('heuristicCrop', () => {
  it('returns a crop with 3:4 aspect ratio', () => {
    const crop = heuristicCrop(1000, 1200)
    expect(crop.width / crop.height).toBeCloseTo(3 / 4, 2)
  })

  it('centers the crop horizontally', () => {
    const crop = heuristicCrop(1000, 1200)
    const leftMargin = crop.x
    const rightMargin = 1000 - (crop.x + crop.width)
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(2)
  })

  it('places the crop in the upper third vertically', () => {
    const crop = heuristicCrop(1000, 1200)
    // Top of crop should be within the upper 1/3 of the image
    expect(crop.y).toBeLessThanOrEqual(1200 / 3)
  })

  it('keeps the crop within image bounds', () => {
    const crop = heuristicCrop(800, 600)
    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThanOrEqual(0)
    expect(crop.x + crop.width).toBeLessThanOrEqual(800)
    expect(crop.y + crop.height).toBeLessThanOrEqual(600)
  })

  it('handles portrait image correctly', () => {
    const crop = heuristicCrop(400, 800)
    expect(crop.width).toBeGreaterThan(0)
    expect(crop.height).toBeGreaterThan(0)
  })

  it('handles landscape image correctly', () => {
    const crop = heuristicCrop(1200, 600)
    expect(crop.width).toBeGreaterThan(0)
    expect(crop.height).toBeGreaterThan(0)
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- suggestCrop
```

Expected: FAIL — `heuristicCrop` not found.

**Step 3: Implement `lib/suggestCrop.ts`**

```ts
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
  // Crop width = 60% of image width, clamped so height fits
  let cropWidth = Math.round(imageWidth * 0.6)
  let cropHeight = Math.round(cropWidth / ASPECT_RATIO)

  // If crop height exceeds image height, shrink to fit
  if (cropHeight > imageHeight) {
    cropHeight = imageHeight
    cropWidth = Math.round(cropHeight * ASPECT_RATIO)
  }

  const x = Math.round((imageWidth - cropWidth) / 2)
  // Place top of crop at ~10% from top (upper-center third)
  const y = Math.round(imageHeight * 0.1)

  // Clamp so crop stays within bounds
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

    // Clamp to image bounds
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
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- suggestCrop
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add lib/suggestCrop.ts lib/__tests__/suggestCrop.test.ts
git commit -m "feat: add suggestCrop with heuristic and face-api.js detection"
```

---

## Task 5: Build `exportImage.ts` (TDD)

**Files:**
- Create: `lib/exportImage.ts`
- Create: `lib/__tests__/exportImage.test.ts`

**Step 1: Write failing tests for the validation logic**

Create `lib/__tests__/exportImage.test.ts`:

```ts
import { validateCrop } from '../exportImage'

describe('validateCrop', () => {
  it('returns true for valid crop', () => {
    expect(validateCrop({ x: 10, y: 10, width: 100, height: 133 })).toBe(true)
  })

  it('returns false for zero width', () => {
    expect(validateCrop({ x: 0, y: 0, width: 0, height: 100 })).toBe(false)
  })

  it('returns false for zero height', () => {
    expect(validateCrop({ x: 0, y: 0, width: 100, height: 0 })).toBe(false)
  })

  it('returns false for negative dimensions', () => {
    expect(validateCrop({ x: 0, y: 0, width: -10, height: 100 })).toBe(false)
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- exportImage
```

Expected: FAIL.

**Step 3: Implement `lib/exportImage.ts`**

```ts
import type { CropRect } from './suggestCrop'

export function validateCrop(crop: CropRect): boolean {
  return crop.width > 0 && crop.height > 0
}

/**
 * Crops the image using the Canvas API and triggers a browser download.
 */
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
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- exportImage
```

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/exportImage.ts lib/__tests__/exportImage.test.ts
git commit -m "feat: add exportImage with canvas crop and download logic"
```

---

## Task 6: Build `Toast` component

**Files:**
- Create: `components/Toast.tsx`

**Step 1: Create `components/Toast.tsx`**

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

  const bg = type === 'success' ? 'bg-gray-900' : 'bg-red-600'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-white text-sm shadow-lg transition-opacity duration-300 ${bg} ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {type === 'success' ? (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {message}
    </div>
  )
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add components/Toast.tsx
git commit -m "feat: add Toast component for export feedback"
```

---

## Task 7: Build `UploadZone` component

**Files:**
- Create: `components/UploadZone.tsx`

**Step 1: Create `components/UploadZone.tsx`**

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
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are supported.'
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File must be under ${MAX_SIZE_MB} MB.`
    }
    return null
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file)
      if (err) {
        setError(err)
        return
      }
      setError(null)
      onFileSelected(file)
    },
    [validate, onFileSelected]
  )

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
  }

  const onDragLeave = () => setDragging(false)

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
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
        className={`w-full max-w-lg h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors select-none
          ${dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'}`}
      >
        {/* Upload icon */}
        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">Drag &amp; drop or click to upload</p>
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Max {MAX_SIZE_MB} MB</p>
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
        <p role="alert" className="text-sm text-red-600 text-center">
          {error}
        </p>
      )}
    </div>
  )
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add components/UploadZone.tsx
git commit -m "feat: add UploadZone with drag-drop, validation, and accessibility"
```

---

## Task 8: Build `CropEditor` component

**Files:**
- Create: `components/CropEditor.tsx`

This component wraps `react-image-crop`, renders the image with the crop overlay, and exposes controls (aspect lock, reset).

**Step 1: Add react-image-crop CSS import to `app/layout.tsx`**

Open `app/layout.tsx`. Add this import at the top:

```tsx
import 'react-image-crop/dist/ReactCrop.css'
```

**Step 2: Create `components/CropEditor.tsx`**

```tsx
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

  // Sync when aiCrop changes (e.g. reset)
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
      {/* Crop image */}
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

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Aspect ratio toggle */}
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
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add components/CropEditor.tsx app/layout.tsx
git commit -m "feat: add CropEditor with react-image-crop, aspect lock controls"
```

---

## Task 9: Wire `app/page.tsx` — the main page

**Files:**
- Modify: `app/page.tsx`

This is the central orchestration: phase state machine, face detection call, rendering each section.

**Step 1: Replace `app/page.tsx`**

```tsx
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
    // Revoke previous object URL to avoid memory leaks
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
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center gap-10">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Headshot Cropper</h1>
          <p className="text-sm text-gray-500 mt-1">AI-suggested crop · adjust · export</p>
        </div>

        {/* Upload zone — always visible until an image is loaded */}
        {phase === 'idle' && (
          <UploadZone onFileSelected={handleFileSelected} />
        )}

        {/* Detecting state — show thumbnail + spinner */}
        {phase === 'detecting' && imageUrl && (
          <div className="relative w-full max-w-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Uploaded portrait" className="w-full h-auto rounded-xl shadow-sm opacity-60" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/60">
              <svg
                className="w-8 h-8 text-gray-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">Analyzing face…</p>
            </div>
            {/* Hidden img to trigger face detection on load */}
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

        {/* Cropping state */}
        {(phase === 'cropping' || phase === 'exporting') && imageUrl && aiCrop && currentCrop && (
          <>
            <CropEditor
              imageUrl={imageUrl}
              aiCrop={aiCrop}
              onCropChange={setCurrentCrop}
              onImageLoad={handleImageLoad}
            />

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
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

      {/* Toast */}
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
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Run the dev server and manually test**

```bash
npm run dev
```

Test the full flow:
- [ ] Drag and drop a JPEG portrait → thumbnail shows with spinner
- [ ] Spinner disappears, crop overlay appears (wait ~5s for face-api.js model to load)
- [ ] Resize and drag the crop rectangle
- [ ] Click "Reset to AI Suggestion" → crop snaps back
- [ ] Toggle aspect ratio buttons (1:1, 3:4, 4:5, free)
- [ ] Click "Export Cropped Image" → file downloads, toast appears
- [ ] Click "Upload another" → returns to upload zone
- [ ] Try uploading a .pdf → error message appears
- [ ] Try uploading a file > 10MB → error message appears

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire main page with phase state machine and full flow"
```

---

## Task 10: Responsive polish and accessibility audit

**Files:**
- Modify: `app/page.tsx` (minor tweaks if needed)
- Modify: `components/CropEditor.tsx` (minor tweaks if needed)

**Step 1: Test on tablet width**

In Chrome DevTools, set viewport to 768px wide. Verify:
- [ ] Upload zone fills width cleanly
- [ ] Crop editor image fills width
- [ ] Buttons wrap without overflow
- [ ] No horizontal scroll

**Step 2: Test keyboard navigation**

Tab through all interactive elements:
- [ ] Upload zone receives focus and triggers file picker on Enter/Space
- [ ] Aspect ratio buttons are focusable and keyboard-operable
- [ ] "Reset" and "Export" buttons are focusable
- [ ] Toast is announced by screen reader (has `role="status"`)

**Step 3: Verify ARIA labels in browser**

Open Chrome DevTools → Accessibility tab. Confirm:
- Upload zone has descriptive label
- Aspect ratio button group has `aria-label="Aspect ratio"`
- Each aspect button has `aria-pressed` state
- Export and reset buttons have `aria-label`

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: accessibility and responsive layout polish"
```

---

## Task 11: Final build verification

**Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests PASS.

**Step 2: Run production build**

```bash
npm run build
```

Expected: build succeeds with no errors. Note any warnings and fix type errors if present.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: verify production build passes"
```

---

## Done

The app is complete. All functional requirements from the spec are met:
- Drag-drop upload with validation
- face-api.js AI crop suggestion with heuristic fallback
- Interactive react-image-crop overlay with aspect lock and reset
- Client-side Canvas export with browser download
- Success toast
- Responsive layout
- Keyboard accessible
