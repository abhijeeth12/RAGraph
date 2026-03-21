import { parseSSEStream } from './utils'
import type {
  SearchRequest, Source, RetrievedImage,
  StreamCallbacks, UploadResponse,
} from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ── Health check ──────────────────────────────────────────────────────────
export async function healthCheck(): Promise<{ status: string; services: Record<string, unknown> }> {
  const res = await fetch(`${BASE_URL}/health`)
  if (!res.ok) throw new Error('Backend unreachable')
  return res.json()
}

// ── Streaming search ──────────────────────────────────────────────────────
export async function streamSearch(
  request: SearchRequest,
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/search/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: abortSignal,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Request failed' }))
    callbacks.onError(err.detail ?? err.message ?? 'Unknown error')
    return
  }

  for await (const raw of parseSSEStream(response)) {
    try {
      const chunk = JSON.parse(raw) as { type: string; content: string }
      switch (chunk.type) {
        case 'text':
          callbacks.onText(chunk.content)
          break
        case 'sources':
          callbacks.onSources(JSON.parse(chunk.content) as Source[])
          break
        case 'images':
          callbacks.onImages(JSON.parse(chunk.content) as RetrievedImage[])
          break
        case 'related':
          callbacks.onRelated(JSON.parse(chunk.content) as string[])
          break
        case 'done': {
          const meta = JSON.parse(chunk.content)
          callbacks.onDone(meta)
          break
        }
        case 'error':
          callbacks.onError(chunk.content)
          break
      }
    } catch {
      // skip malformed chunks
    }
  }
}

// ── Document upload ───────────────────────────────────────────────────────
export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE_URL}/api/documents/upload`)

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        const err = JSON.parse(xhr.responseText)
        reject(new Error(err.detail ?? 'Upload failed'))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))

    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}

// ── Poll ingestion status ─────────────────────────────────────────────────
export async function pollIngestionStatus(docId: string): Promise<IngestionStatus> {
  const res = await fetch(`${BASE_URL}/api/documents/${docId}/status`)
  if (!res.ok) throw new Error('Status check failed')
  return res.json()
}

export async function listDocuments(): Promise<{ documents: IngestionStatus[] }> {
  const res = await fetch(`${BASE_URL}/api/documents/`)
  if (!res.ok) throw new Error('Failed to list documents')
  return res.json()
}

// ── Image URL resolver ────────────────────────────────────────────────────
// Images are served by FastAPI at localhost:8000/uploads/images/xxx
// Next.js rewrites /uploads/* -> localhost:8000/uploads/* so relative URLs work
export function resolveImageUrl(storageUrl: string): string {
  if (!storageUrl) return ''
  // Already absolute URL
  if (storageUrl.startsWith('http')) return storageUrl
  // Relative path like /uploads/images/xxx.jpeg
  // With Next.js rewrite this works directly — no need to prepend BASE_URL
  return storageUrl
}

// ── Types ─────────────────────────────────────────────────────────────────
export interface IngestionStatus {
  doc_id: string
  filename: string
  status: 'queued' | 'parsing' | 'embedding' | 'indexing' | 'done' | 'error'
  page_count: number
  node_count: number
  image_count: number
  h1_count: number
  h2_count: number
  paragraph_count: number
  error?: string
  ingested_at?: string
}

export interface StreamCallbacks {
  onText:    (delta: string) => void
  onSources: (sources: Source[]) => void
  onImages:  (images: RetrievedImage[]) => void
  onRelated: (questions: string[]) => void
  onDone:    (meta: Record<string, unknown>) => void
  onError:   (error: string) => void
}

export const MOCK_SOURCES: Source[] = [
  {
    id: 'src-1',
    title: 'RAG for Knowledge-Intensive NLP Tasks',
    url: 'https://arxiv.org/abs/2005.11401',
    favicon: '',
    domain: 'arxiv.org',
    snippet: 'RAG combines pre-trained parametric memory with non-parametric retrieval...',
    relevance_score: 0.94,
    heading_path: ['Abstract'],
  },
]
