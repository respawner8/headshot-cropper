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
