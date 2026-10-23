import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Study Space — LLM Intelligence & Document Research Assistant',
  description: 'Study Space (studyspacellm.tech) turns your notes, PDFs, and textbooks into an interactive, visual workspace with instant answers and verified citations.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}