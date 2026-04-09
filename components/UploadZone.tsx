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
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
          dragging ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/40 scale-110' : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/25'
        }`}>
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

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
