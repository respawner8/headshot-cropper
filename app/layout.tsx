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
