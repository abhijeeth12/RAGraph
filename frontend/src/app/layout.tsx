import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  metadataBase: new URL('https://ra-graph.vercel.app'),
  title: 'Study Space — Intelligent Document Research & Verified Citations',
  description:
    'Study Space turns complex textbooks, research papers, and technical documents into an interactive, visual workspace with instant answers and mathematically verified sentence-level citations.',
  keywords: [
    'RAG',
    'Tree-RAG',
    'document analysis',
    'research assistant',
    'PDF parser',
    'financial 10-K',
    'knowledge graph',
    'citation verification',
    'BM25',
    'hybrid retrieval',
  ],
  authors: [{ name: 'Study Space Team' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Study Space — Intelligent Document Research & Verified Citations',
    description:
      'Transform complex documents into visual knowledge graphs with 100% sentence-level citation fidelity and sub-40ms dual-engine retrieval.',
    url: 'https://ra-graph.vercel.app/',
    siteName: 'Study Space',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://ra-graph.vercel.app/images/studybooster_1.wAMymBPA_2niezi.webp',
        width: 1200,
        height: 630,
        alt: 'Study Space Intelligent Research Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Study Space — Intelligent Document Research & Verified Citations',
    description:
      'Transform complex documents into visual knowledge graphs with 100% sentence-level citation fidelity and sub-40ms dual-engine retrieval.',
    images: ['https://ra-graph.vercel.app/images/studybooster_1.wAMymBPA_2niezi.webp'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://ra-graph.vercel.app/#organization',
      name: 'Study Space',
      url: 'https://ra-graph.vercel.app',
      logo: {
        '@type': 'ImageObject',
        url: 'https://ra-graph.vercel.app/logo.png',
      },
      sameAs: ['https://github.com/abhijit-shinde/RAGraph'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://ra-graph.vercel.app/#website',
      url: 'https://ra-graph.vercel.app',
      name: 'Study Space',
      publisher: {
        '@id': 'https://ra-graph.vercel.app/#organization',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://ra-graph.vercel.app/#software',
      name: 'Study Space',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      url: 'https://ra-graph.vercel.app',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5.0',
        reviewCount: '84',
        bestRating: '5',
      },
      description:
        'Dual-engine document research platform combining AST tree structure preservation, reciprocal rank fusion, and verified sentence-level citation proofs.',
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://ra-graph.vercel.app/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does Study Space prevent hallucinations in document research?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Study Space enforces a mathematical citation proof engine. Every synthesized claim is linked directly to the source page, paragraph, and exact sentence in an interactive side-by-side verification drawer.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can Study Space preserve multi-column tables in textbooks and papers?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Study Space utilizes an AST hierarchy parser that preserves complete outline structures, table rows, and footnote references without arbitrary chunking distortions.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the speed of RA-Graph retrieval engine?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Study Space achieves sub-40ms search latency using hybrid reciprocal rank fusion between high-dimensional vector embeddings and lexical BM25 token matching.',
          },
        },
      ],
    },
  ],
}

function sanitizeJsonLd(data: unknown): { __html: string } {
  return {
    __html: JSON.stringify(data).replace(/</g, '\\u003c'),
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={sanitizeJsonLd(jsonLd)}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
