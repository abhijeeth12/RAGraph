import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'RAGraph — Hierarchical RAG & Knowledge Graph Engine',
  description: 'Hierarchical retrieval and multi-document reasoning engine.',
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