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
        className={`w-full h-40 sm:h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all select-none
          ${dragging ? 'border-gray-800 bg-gray-50 scale-[1.01]' : 'border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${dragging ? 'bg-gray-200' : 'bg-gray-100'}`}>
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">Drag &amp; drop or <span className="text-gray-900 underline underline-offset-2">browse</span></p>
          <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, WebP · max {MAX_SIZE_MB} MB</p>
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
