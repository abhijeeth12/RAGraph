// ===== CORE RAG TYPES =====

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

export interface SearchResult {
  query: string
  answer: string
  sources: Source[]
  images: RetrievedImage[]
  related_questions: string[]
  model_used: string
  tokens_used?: number
  time_ms?: number
  hyde_used?: boolean
  dual_path_fallback_used?: boolean
}

// ===== THREAD / HISTORY =====

export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: MessageRole
  content: string
  sources?: Source[]
  images?: RetrievedImage[]
  related_questions?: string[]
  timestamp: Date
  isStreaming?: boolean
  meta?: {
    time_ms?: number
    tokens?: number
    hyde_used?: boolean
    dual_path_fallback_used?: boolean
    total_candidates?: number
    chunks_used?: number
  }
}

export interface Thread {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model: ModelOption
  focus: FocusMode
}

// ===== OPTIONS =====

export type ModelOption =
  | 'gpt-4o'
  | 'claude-3-5-sonnet'
  | 'mistralai/mistral-7b-instruct:free'  // ✅ fixed

export const MODEL_LABELS: Record<ModelOption, string> = {
  'gpt-4o': 'GPT-4o',
  'claude-3-5-sonnet': 'Claude 3.5',
  'mistralai/mistral-7b-instruct:free': 'Mistral 7B (Free)', // ✅ fixed
}

export type FocusMode = 'all' | 'academic' | 'code' | 'news' | 'images'

export const FOCUS_LABELS: Record<FocusMode, { label: string; icon: string }> = {
  all:      { label: 'All',      icon: 'Globe' },
  academic: { label: 'Academic', icon: 'GraduationCap' },
  code:     { label: 'Code',     icon: 'Code2' },
  news:     { label: 'News',     icon: 'Newspaper' },
  images:   { label: 'Images',   icon: 'Image' },
}

// ===== API REQUEST =====

export interface SearchRequest {
  query: string
  model: ModelOption
  focus: FocusMode
  thread_id?: string
  conversation_history?: Array<{ role: MessageRole; content: string }>
  image?: string
  use_hyde?: boolean
  use_dual_path?: boolean
}

export interface UploadResponse {
  doc_id: string
  filename: string
  status: string
  message: string
  page_count?: number
  node_count?: number
  image_count?: number
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

// ===== STREAM =====

export interface StreamCallbacks {
  onText:    (delta: string) => void
  onSources: (sources: Source[]) => void
  onImages:  (images: RetrievedImage[]) => void
  onRelated: (questions: string[]) => void
  onDone:    (meta: Record<string, unknown>) => void
  onError:   (error: string) => void
}