import { parseSSEStream, generateId } from './utils'
import type { SearchRequest, Source, RetrievedImage, UploadResponse, DocumentInfo, CitationEntry, Notebook } from './types'
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
    cache: 'no-store', // no-caching mandate: never use the browser HTTP cache
  }
  
  let res = await fetch(`${BASE_URL}${endpoint}`, config)
  
  // Silent refresh flow
  if (res.status === 401 && token) {
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store'
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
  const res = await fetch(`${BASE_URL}/api/health`, { cache: 'no-store' })
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

export async function restoreSession(): Promise<{ user: { user_id: string; email: string }; token: string } | null> {
  // 1. Check local session cache in localStorage
  let cachedUser: { user_id: string; email: string } | null = null
  let cachedToken: string | null = null

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('ragraph_auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.user?.user_id && parsed?.token) {
          cachedUser = parsed.user
          cachedToken = parsed.token
        }
      }
    } catch (e) {
      console.warn('Could not read cached auth:', e)
    }
  }

  // 2. Try to refresh via backend cookie endpoint
  try {
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    })

    if (refreshRes.ok) {
      const data = await refreshRes.json()
      const newToken = data.access_token

      const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${newToken}` },
        credentials: 'include',
        cache: 'no-store',
      })

      if (meRes.ok) {
        const userData = await meRes.json()
        const user = { user_id: userData.user_id || userData.id, email: userData.email }
        return { user, token: newToken }
      } else if (cachedUser) {
        return { user: cachedUser, token: newToken }
      }
    }
  } catch (e) {
    console.warn('Backend refresh check unavailable, falling back to local session if present:', e)
  }

  // 3. Fallback to cached user & token if valid
  if (cachedUser && cachedToken) {
    return { user: cachedUser, token: cachedToken }
  }

  return null
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

export async function getDocumentGraph(docIds?: string[]) {
  const state = useSearchStore.getState()
  const urlParams = new URLSearchParams()
  if (!state.user) urlParams.append('session_id', state.getOwnerId() || '')
  if (docIds && docIds.length > 0) urlParams.append('doc_ids', docIds.join(','))
  
  const res = await apiFetch(`/api/documents/graph?${urlParams}`)
  if (!res.ok) throw new Error('Failed to fetch document graph')
  return res.json()
}

export async function getDocumentOutline(docIds?: string[]) {
  const state = useSearchStore.getState()
  const urlParams = new URLSearchParams()
  if (!state.user) urlParams.append('session_id', state.getOwnerId() || '')
  if (docIds && docIds.length > 0) urlParams.append('doc_ids', docIds.join(','))
  const res = await apiFetch(`/api/documents/outline?${urlParams}`)
  if (!res.ok) throw new Error('Failed to fetch outline')
  return res.json()
}

// ─── Notebook knowledge map (on-demand, persisted per notebook scope) ────

export interface KnowledgeMapState {
  exists: boolean
  status: string
  outline?: any
  graph?: { nodes: any[]; links: any[] }
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

function ownerParams(urlParams: URLSearchParams, notebookId?: string, docIds?: string[]) {
  const state = useSearchStore.getState()
  if (notebookId) urlParams.append('notebook_id', notebookId)
  if (!state.user) urlParams.append('session_id', state.getOwnerId() || '')
  if (docIds && docIds.length > 0) urlParams.append('doc_ids', docIds.join(','))
  return urlParams
}

export async function getKnowledgeMap(
  notebookId: string,
  docIds?: string[]
): Promise<KnowledgeMapState> {
  const urlParams = ownerParams(new URLSearchParams(), notebookId, docIds)
  const res = await apiFetch(`/api/knowledge-map?${urlParams}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch knowledge map')
  return res.json()
}

export async function generateKnowledgeMap(
  notebookId: string,
  docIds?: string[]
): Promise<{ accepted: boolean; status: string }> {
  const state = useSearchStore.getState()
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const token = state.token
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await apiFetch(`/api/knowledge-map/generate`, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      notebook_id: notebookId,
      doc_ids: docIds && docIds.length > 0 ? docIds : null,
    }),
  })
  if (res.status === 409) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Map generation already in progress — please wait.')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Failed to start map generation')
  }
  return res.json()
}

export async function deleteKnowledgeMap(notebookId: string): Promise<boolean> {
  const urlParams = ownerParams(new URLSearchParams(), notebookId)
  const res = await apiFetch(`/api/knowledge-map?${urlParams}`, { method: 'DELETE' })
  return res.ok
}

export async function silentRefresh() {
  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store'
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

  const activeNbId = request.notebook_id || state.activeNotebookId
  const searchPayload = {
    ...request,
    notebook_id: activeNbId || undefined,
  }

  const response = await fetch(`${BASE_URL}/api/search/stream?${urlParams}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(searchPayload),
    signal: abortSignal,
    credentials: 'include',
    cache: 'no-store'
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
  notebookIdOrProgress?: string | null | ((pct: number) => void),
  onProgress?: (pct: number) => void,
): Promise<UploadResponse> {
  let targetNotebookId: string | null | undefined
  let progressCb: ((pct: number) => void) | undefined

  if (typeof notebookIdOrProgress === 'function') {
    progressCb = notebookIdOrProgress
    targetNotebookId = undefined
  } else {
    targetNotebookId = notebookIdOrProgress
    progressCb = onProgress
  }

  const state = useSearchStore.getState()
  const token = state.token
  const csrf = getCookie('ragraph_csrf')
  
  const ownerId = state.getOwnerId()
  if (!ownerId) throw new Error('No owner ID')

  let effectiveNotebookId = targetNotebookId !== undefined ? targetNotebookId : state.activeNotebookId

  // Guarantee the target notebook is persisted server-side BEFORE uploading.
  // This is the fix for the documents_notebook_id_fkey 500: client-only
  // notebooks (the guest demo, or ones created while offline) are synchronised
  // through the real notebook API first so the FK can never be violated.
  if (effectiveNotebookId) {
    effectiveNotebookId = await state.ensureNotebookId(effectiveNotebookId)
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    const urlParams = new URLSearchParams()
    if (!state.user) urlParams.append('session_id', ownerId)
    if (effectiveNotebookId) urlParams.append('notebook_id', effectiveNotebookId)
      
    xhr.open('POST', `${BASE_URL}/api/documents/upload?${urlParams}`)
    
    xhr.withCredentials = true // Send cookies
    
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    if (csrf) xhr.setRequestHeader('X-CSRF-Token', csrf)
    
    xhr.upload.onprogress = (e) => {
      if (progressCb && e.total) progressCb(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)) }
        catch(e){ reject(new Error(`Invalid JSON ${xhr.status}: ${xhr.responseText.slice(0,500)}`)) }
      } else {
        let msg = `Upload failed ${xhr.status}`
        try { msg = JSON.parse(xhr.responseText)?.detail ?? msg } catch { msg += `: ${xhr.responseText.slice(0,500)}` }
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error(`Network error: BASE_URL=${BASE_URL} status=${xhr.status} readyState=${xhr.readyState} - check CORS / mixed content / adblock / Render sleep (try health https://ragraph-backend.onrender.com/api/health)`))
    xhr.ontimeout = () => reject(new Error(`Timeout: BASE_URL=${BASE_URL}`))
    xhr.onabort = () => reject(new Error(`Aborted: BASE_URL=${BASE_URL}`))
    
    const form = new FormData()
    form.append('file', file)
    if (effectiveNotebookId) form.append('notebook_id', effectiveNotebookId)
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

export async function listDocuments(notebookId?: string | null): Promise<{ documents: DocumentInfo[]; total: number }> {
  const state = useSearchStore.getState()
  const targetNotebookId = notebookId !== undefined ? notebookId : state.activeNotebookId
  const urlParams = new URLSearchParams()
  if (!state.user) urlParams.append('session_id', state.getOwnerId() || '')
  if (targetNotebookId) urlParams.append('notebook_id', targetNotebookId)
  
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

// ─── Notebooks API ─────────────────────────────────────────────────────────

export async function listNotebooks(): Promise<Notebook[]> {
  try {
    const res = await apiFetch(`/api/notebooks/`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        return data.map((d: any) => ({
          id: d.id,
          title: d.title || 'Untitled Notebook',
          description: d.description || '',
          model: d.model || 'openrouter/free',
          focus: d.focus || 'all',
          document_count: d.document_count || 0,
          conversation_count: d.conversation_count || 0,
          messageCount: d.conversation_count || 0,
          documents: [],
          createdAt: new Date(d.created_at || Date.now()),
          updatedAt: new Date(d.updated_at || Date.now()),
          persisted: true,
        }))
      }
    }
  } catch (e) {
    console.warn('listNotebooks API error:', e)
  }
  return useSearchStore.getState().notebooks
}

function notebookFromApi(d: any): Notebook {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    model: d.model,
    focus: d.focus,
    document_count: d.document_count || 0,
    conversation_count: d.conversation_count || 0,
    messageCount: d.conversation_count || 0,
    documents: [],
    createdAt: new Date(d.created_at || Date.now()),
    updatedAt: new Date(d.updated_at || Date.now()),
    persisted: true,
  }
}

async function _createNotebookRequest(
  id: string,
  title: string,
  description: string | undefined,
  model: string,
  focus: string,
): Promise<Response> {
  return apiFetch(`/api/notebooks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, title, description, model, focus }),
  })
}

export async function createNotebook(
  title: string,
  description?: string,
  model = 'openrouter/free',
  focus = 'all',
  id?: string
): Promise<Notebook> {
  const generatedId = id || 'nb_' + generateId().slice(0, 8)
  // No silent local fallback: a notebook that is not persisted server-side
  // cannot later receive documents (the FK would reject them), so surface the
  // failure to the caller instead of fabricating an unusable notebook.
  const res = await _createNotebookRequest(generatedId, title, description, model, focus)
  if (!res.ok) {
    let detail = `Failed to create notebook (${res.status})`
    try { detail = JSON.parse(await res.text())?.detail ?? detail } catch { /* keep default */ }
    throw new Error(detail)
  }
  return notebookFromApi(await res.json())
}

/**
 * Guarantee a client-side notebook exists in the backend database.
 *
 * Idempotent: reuses the notebook's existing id when possible (the backend
 * returns the existing row for the same owner). If that id already belongs to
 * a different owner (e.g. the shared "nb-tree-rag" guest demo id opened by
 * another visitor), it transparently falls back to a fresh canonical id so the
 * user always ends up with a notebook they own.
 */
export async function ensureNotebookPersisted(nb: Notebook, reuseId = true): Promise<Notebook> {
  // The shared guest-demo id ("nb-tree-rag") is not safe to reuse across
  // sessions, so those notebooks materialise under a fresh canonical id.
  let res = await _createNotebookRequest(
    reuseId ? nb.id : 'nb_' + generateId().slice(0, 8),
    nb.title, nb.description, nb.model || 'openrouter/free', (nb.focus as string) || 'all',
  )
  if (res.status === 409) {
    const freshId = 'nb_' + generateId().slice(0, 8)
    res = await _createNotebookRequest(freshId, nb.title, nb.description, nb.model || 'openrouter/free', (nb.focus as string) || 'all')
  }
  if (!res.ok) {
    let detail = `Notebook sync failed (${res.status})`
    try { detail = JSON.parse(await res.text())?.detail ?? detail } catch { /* keep default */ }
    throw new Error(detail)
  }
  return notebookFromApi(await res.json())
}

export async function deleteNotebook(notebookId: string): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/notebooks/${notebookId}`, { method: 'DELETE' })
    if (res.ok) return true
  } catch (e) {
    console.warn('deleteNotebook API error:', e)
  }
  return false
}

export async function updateNotebook(
  notebookId: string,
  fields: { title?: string; description?: string; model?: string; focus?: string }
): Promise<void> {
  try {
    await apiFetch(`/api/notebooks/${notebookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
  } catch (e) {
    console.warn('updateNotebook API error:', e)
  }
}

// ─── Conversations API ───────────────────────────────────────────────────────

export async function listConversations(notebookId?: string | null) {
  const state = useSearchStore.getState()
  const targetNotebookId = notebookId !== undefined ? notebookId : state.activeNotebookId
  const urlParams = new URLSearchParams()
  if (targetNotebookId) urlParams.append('notebook_id', targetNotebookId)
  const res = await apiFetch(`/api/conversations/?${urlParams}`)
  if (!res.ok) return []
  return res.json()
}

export async function getMessages(conversationId: string) {
  const res = await apiFetch(`/api/conversations/${conversationId}/messages`)
  if (!res.ok) return []
  return res.json()
}

export async function createConversation(
  id: string,
  title: string,
  model: string,
  focus: string,
  notebookId?: string | null
) {
  const targetNotebookId = notebookId !== undefined ? notebookId : useSearchStore.getState().activeNotebookId
  const res = await apiFetch(`/api/conversations/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, title, model, focus, notebook_id: targetNotebookId })
  })
  if (!res.ok) {
    let detail = `Failed to create conversation (${res.status})`
    try {
      const body = await res.json()
      if (body?.detail) detail = body.detail
    } catch {
      // non-JSON error body — keep the status-based message
    }
    throw new Error(detail)
  }
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
