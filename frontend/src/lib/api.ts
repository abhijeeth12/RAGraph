import { parseSSEStream } from './utils'
import type { SearchRequest, Source, RetrievedImage, UploadResponse, DocumentInfo, CitationEntry } from './types'
import { useSearchStore } from '@/store/useSearchStore'
import type { SearchState } from '@/store/useSearchStore'

export type ApiStore = SearchState

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

/**
 * Core wrapper that adds:
 * 1. Authorization header (from store)
 * 2. credentials config (for cookies)
 * 3. CSRF header for mutations
 * 4. Automatic token refresh on 401
 */
async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const state = useSearchStore.getState()
  const token = state.token
  const csrf = getCookie('ragraph_csrf')
  
  const headers = new Headers(options.headers || {})
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  // CSRF protection for state-changing endpoints
  if (csrf && options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
    headers.set('X-CSRF-Token', csrf)
  }
  
  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // essential for HTTPOnly refresh + CSRF cookies
  }
  
  let res = await fetch(`${BASE_URL}${endpoint}`, config)
  
  // Silent refresh flow
  if (res.status === 401 && token) {
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    })
    
    if (refreshRes.ok) {
      const data = await refreshRes.json()
      // Update global store with new token
      state.setUser(state.user, data.access_token)
      // Retry original request (copy original config but with new token)
      headers.set('Authorization', `Bearer ${data.access_token}`)
      config.headers = headers
      res = await fetch(`${BASE_URL}${endpoint}`, config)
    } else {
      // Refresh failed, meaning session is truly dead. Force logout.
      state.logout()
    }
  }
  
  return res
}


export async function healthCheck() {
  const res = await fetch(`${BASE_URL}/api/health`)
  if (!res.ok) throw new Error('Backend unreachable')
  return res.json()
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export async function signup(email: string, password: string) {
  const res = await apiFetch(`/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Signup failed' }))
    throw new Error(err.detail ?? 'Signup failed')
  }
  return res.json()
}

export async function login(email: string, password: string) {
  const res = await apiFetch(`/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }))
    throw new Error(err.detail ?? 'Login failed')
  }
  return res.json()
}

export async function logout() {
  await apiFetch(`/api/auth/logout`, { method: 'POST' })
}

export async function getMe() {
  const res = await apiFetch(`/api/auth/me`)
  if (!res.ok) throw new Error('Not authenticated')
  return res.json()
}

export async function getGoogleAuthUrl() {
  const res = await apiFetch(`/api/auth/google/url`)
  if (!res.ok) throw new Error('Failed to get Google URL')
  return res.json()
}

export async function googleCallback(code: string) {
  const res = await apiFetch(`/api/auth/google/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })
  if (!res.ok) throw new Error('Google login failed')
  return res.json()
}

export async function silentRefresh() {
  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include'
  })
  if (!res.ok) throw new Error('Refresh failed')
  return res.json()
}

export async function cleanupSession(sessionId: string) {
  try {
    await apiFetch(`/api/documents/session/${sessionId}/cleanup`, {
      method: 'DELETE',
    })
  } catch {
    // Best-effort cleanup, ignore errors
  }
}

// ─── Search API ──────────────────────────────────────────────────────────────

export interface StreamCallbacks {
  onText:      (delta: string) => void
  onSources:   (sources: Source[]) => void
  onImages:    (images: RetrievedImage[]) => void
  onCitations: (map: Record<string, CitationEntry>) => void
  onRelated:   (questions: string[]) => void
  onDone:      (meta: Record<string, unknown>) => void
  onError:     (error: string) => void
}

export async function streamSearch(
  request: SearchRequest & { session_id: string },
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal,
): Promise<void> {

  const state = useSearchStore.getState()
  const token = state.token
  const csrf = getCookie('ragraph_csrf')

  // Construct URL
  const urlParams = new URLSearchParams()
  // Search.py expects session_id in URL as owner identifier for both logged in and guest users
  urlParams.append('session_id', request.session_id)
  
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (csrf) headers.set('X-CSRF-Token', csrf)

  const response = await fetch(`${BASE_URL}/api/search/stream?${urlParams}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
    signal: abortSignal,
    credentials: 'include'
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
        case 'text':      callbacks.onText(chunk.content); break
        case 'sources':   callbacks.onSources(JSON.parse(chunk.content)); break
        case 'images':    callbacks.onImages(JSON.parse(chunk.content)); break
        case 'citations': callbacks.onCitations(JSON.parse(chunk.content)); break
        case 'related':   callbacks.onRelated(JSON.parse(chunk.content)); break
        case 'done':      callbacks.onDone(JSON.parse(chunk.content)); break
        case 'error':     callbacks.onError(chunk.content); break
      }
    } catch { /* skip malformed */ }
  }
}

// ─── Document API ────────────────────────────────────────────────────────────

export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResponse> {
  const state = useSearchStore.getState()
  const token = state.token
  const csrf = getCookie('ragraph_csrf')
  
  const ownerId = state.getOwnerId()
  if (!ownerId) throw new Error('No owner ID')
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    const urlParams = new URLSearchParams()
    if (!state.user) urlParams.append('session_id', ownerId)
      
    xhr.open('POST', `${BASE_URL}/api/documents/upload?${urlParams}`)
    
    xhr.withCredentials = true // Send cookies
    
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    if (csrf) xhr.setRequestHeader('X-CSRF-Token', csrf)
    
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      // Simple 401 unhandled retry logic for XHR isn't strict here as it depends on user action.
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText))
      else reject(new Error(JSON.parse(xhr.responseText)?.detail ?? 'Upload failed'))
    }
    xhr.onerror = () => reject(new Error('Network error'))
    
    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}

export async function pollIngestionStatus(docId: string) {
  const urlParams = new URLSearchParams()
  const state = useSearchStore.getState()
  if (!state.user) urlParams.append('session_id', state.getOwnerId())
  
  const res = await apiFetch(`/api/documents/${docId}/status?${urlParams}`)
  if (!res.ok) throw new Error('Status check failed')
  return res.json()
}

export async function listDocuments(): Promise<{ documents: DocumentInfo[]; total: number }> {
  const state = useSearchStore.getState()
  const urlParams = new URLSearchParams()
  if (!state.user) urlParams.append('session_id', state.getOwnerId() || '')
  
  const res = await apiFetch(`/api/documents/?${urlParams}`)
  if (!res.ok) throw new Error('Failed to list documents')
  return res.json()
}

export async function deleteDocument(docId: string) {
  const state = useSearchStore.getState()
  const urlParams = new URLSearchParams()
  if (!state.user) urlParams.append('session_id', state.getOwnerId() || '')
  
  const res = await apiFetch(`/api/documents/${docId}?${urlParams}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
  return res.json()
}

export async function getDocumentContent(docId: string) {
  const state = useSearchStore.getState()
  const urlParams = new URLSearchParams()
  if (!state.user) urlParams.append('session_id', state.getOwnerId() || '')
  
  const res = await apiFetch(`/api/documents/${docId}/content?${urlParams}`)
  if (!res.ok) throw new Error('Failed to get document content')
  return res.json()
}

export async function clearCache() {
  await apiFetch(`/cache/clear`, { method: 'DELETE' })
}

export function resolveImageUrl(storageUrl: string): string {
  if (!storageUrl) return ''
  if (storageUrl.startsWith('http')) return storageUrl
  return storageUrl
}

// ─── Conversations API ───────────────────────────────────────────────────────

export async function listConversations() {
  const res = await apiFetch(`/api/conversations/`)
  if (!res.ok) return [] // silently fail
  return res.json()
}

export async function getMessages(conversationId: string) {
  const res = await apiFetch(`/api/conversations/${conversationId}/messages`)
  if (!res.ok) return []
  return res.json()
}

export async function createConversation(id: string, title: string, model: string, focus: string) {
  const res = await apiFetch(`/api/conversations/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, title, model, focus })
  })
  if (!res.ok) throw new Error('Failed to create conversation')
  return res.json()
}


interface SaveMessagePayload {
  role: 'user' | 'assistant'
  content: string
  sources?: unknown
  images?: unknown
  citation_map?: unknown
  related_questions?: unknown
  meta?: unknown
}

export async function saveMessage(conversationId: string, payload: SaveMessagePayload) {
  const res = await apiFetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to save message')
  return res.json()
}

export async function deleteConversation(conversationId: string) {
  const res = await apiFetch(`/api/conversations/${conversationId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Delete conversation failed')
  return res.json()
}
