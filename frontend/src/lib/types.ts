export interface AuthUser {
  user_id: string
  email: string
}

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
  notebook_id?: string
  number: number
  filename: string
  status: 'queued' | 'parsing' | 'embedding' | 'indexing' | 'done' | 'error'
  node_count: number
  image_count: number
  table_count?: number
  page_count: number
  extraction_method?: string | null
  size_bytes: number
  content?: string
  created_at?: string
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
  notebook_id?: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model: string
  focus: FocusMode
  persisted?: boolean
}

export type AppView = 'landing' | 'dashboard' | 'workspace'

export interface Notebook {
  id: string
  title: string
  description?: string
  documents?: DocumentInfo[]
  document_count?: number
  conversation_count?: number
  messageCount?: number
  model?: string
  focus?: FocusMode
  createdAt: Date
  updatedAt: Date
  isGuestDemo?: boolean
  persisted?: boolean
}

export type FocusMode = 'all' | 'academic' | 'code' | 'news' | 'images' | 'finance'

export const FOCUS_LABELS: Record<string, { label: string; icon: string }> = {
  all:      { label: 'All',      icon: 'Globe' },
  academic: { label: 'Academic', icon: 'GraduationCap' },
  code:     { label: 'Code',     icon: 'Code2' },
  news:     { label: 'News',     icon: 'Newspaper' },
  images:   { label: 'Images',   icon: 'Image' },
  finance:  { label: 'Finance',  icon: 'LineChart' },
}

export const MODEL_LABELS: Record<string, string> = {
  'openrouter/free':                               'Auto Free (OpenRouter)',
  'gpt-4o':                                        'GPT-4o (OpenAI)',
  'claude-3-5-sonnet':                             'Claude 3.5 Sonnet',
  'gemini-1.5-pro':                                'Gemini 1.5 Pro',
  'meta-llama/llama-3.3-70b-instruct:free':        'Llama 3.3 70B (Free)',
  'mistralai/mistral-small-3.1-24b-instruct:free': 'Mistral Small (Free)',
  'google/gemma-3-27b-it:free':                    'Gemma 3 (Free)',
}

export interface SearchRequest {
  session_id: string
  query: string
  model: string
  focus: FocusMode
  thread_id?: string
  notebook_id?: string
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>
  image?: string
  use_hyde?: boolean
  use_dual_path?: boolean
  selected_doc_ids?: string[]
}

export interface UploadResponse {
  doc_id: string
  filename: string
  status: string
  message: string
}

export interface KnowledgeMapState {
  exists: boolean
  status: string
  notebook_id?: string
  outline?: {
    name: string
    children?: any[]
  }
  graph?: {
    nodes: any[]
    links: any[]
  }
  doc_ids?: string[]
  doc_count?: number
  stale?: boolean
  new_docs?: string[]
  generating?: boolean
  empty?: boolean
  message?: string
  error?: string
  updated_at?: string | null
}
