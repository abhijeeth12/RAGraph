export interface Source {
  id: string
  title: string
  url: string
  favicon?: string
  domain: string
  snippet: string
  relevance_score: number
  heading_path: string[]
  doc_id?: string
}

export interface RetrievedImage {
  id: string
  url: string
  caption?: string
  alt?: string
  source_title: string
  source_url: string
  heading_path: string[]
  relevance_score: number
  width?: number
  height?: number
}

export interface CitationEntry {
  doc_number: number
  filename: string
  label: string
  heading: string
}

export interface DocumentInfo {
  doc_id: string
  number: number
  filename: string
  status: 'queued' | 'parsing' | 'embedding' | 'indexing' | 'done' | 'error'
  node_count: number
  image_count: number
  page_count: number
  size_bytes: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  images?: RetrievedImage[]
  related_questions?: string[]
  citation_map?: Record<string, CitationEntry>
  timestamp: Date
  isStreaming?: boolean
  meta?: {
    time_ms?: number
    tokens?: number
    hyde_used?: boolean
    dual_path_fallback_used?: boolean
    chunks_used?: number
    strategies_used?: string[]
  }
}

export interface Thread {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model: string
  focus: FocusMode
}

export type FocusMode = 'all' | 'academic' | 'code' | 'news' | 'images'

export const FOCUS_LABELS: Record<FocusMode, { label: string; icon: string }> = {
  all:      { label: 'All',      icon: 'Globe' },
  academic: { label: 'Academic', icon: 'GraduationCap' },
  code:     { label: 'Code',     icon: 'Code2' },
  news:     { label: 'News',     icon: 'Newspaper' },
  images:   { label: 'Images',   icon: 'Image' },
}

export type ModelOption = string

export const MODEL_LABELS: Record<string, string> = {
  'gpt-4o':                                        'GPT-4o',
  'claude-3-5-sonnet':                             'Claude 3.5',
  'openrouter/free':                               'Auto Free',
  'meta-llama/llama-3.3-70b-instruct:free':        'Llama 3.3 (Free)',
  'mistralai/mistral-small-3.1-24b-instruct:free': 'Mistral Small (Free)',
  'google/gemma-3-27b-it:free':                    'Gemma 3 (Free)',
}

export interface SearchRequest {
  session_id: string
  query: string
  model: string
  focus: FocusMode
  thread_id?: string
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>
  image?: string
  use_hyde?: boolean
  use_dual_path?: boolean
}

export interface UploadResponse {
  doc_id: string
  filename: string
  status: string
  message: string
}
