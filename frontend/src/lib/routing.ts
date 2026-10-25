import type { AppView, AuthUser } from './types'

export interface ParsedRoute {
  view: AppView
  notebookId: string | null
  threadId: string | null
  sectionId: string | null
  isAuthCallback: boolean
  rawPath: string
  queryParams: Record<string, string>
}

export const STORAGE_KEYS = {
  AUTH: 'ragraph_auth',
  THEME: 'ragraph_notebook_theme',
  LAST_NOTEBOOK: 'ragraph_last_active_notebook',
  LAST_THREAD: 'ragraph_last_active_thread',
  PENDING_DESTINATION: 'ragraph_pending_auth_destination',
  SELECTION_PREFIX: 'ragraph_nb_selection_',
} as const

/**
 * Safely reads and parses the stored authentication credentials from localStorage.
 */
export function getStoredAuth(): { user: AuthUser; token: string; refreshToken?: string | null } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.user?.user_id && parsed?.token) {
      return {
        user: parsed.user,
        token: parsed.token,
        refreshToken: parsed.refreshToken || null,
      }
    }
  } catch (err) {
    console.warn('[Routing] Failed to read cached auth:', err)
  }
  return null
}

/**
 * Get the pending auth destination saved before an unauthenticated redirect or OAuth flow.
 */
export function getPendingAuthDestination(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const sessionVal = sessionStorage.getItem(STORAGE_KEYS.PENDING_DESTINATION)
    if (sessionVal) return sessionVal
    const localVal = localStorage.getItem(STORAGE_KEYS.PENDING_DESTINATION)
    if (localVal) return localVal
  } catch {}
  return null
}

/**
 * Store the pending auth destination in both sessionStorage and localStorage for resiliency.
 */
export function setPendingAuthDestination(destination: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (destination) {
      sessionStorage.setItem(STORAGE_KEYS.PENDING_DESTINATION, destination)
      localStorage.setItem(STORAGE_KEYS.PENDING_DESTINATION, destination)
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.PENDING_DESTINATION)
      localStorage.removeItem(STORAGE_KEYS.PENDING_DESTINATION)
    }
  } catch {}
}

/**
 * Get the last active notebook id for this browser session.
 */
export function getLastActiveNotebookId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_NOTEBOOK)
  } catch {
    return null
  }
}

/**
 * Set the last active notebook id.
 */
export function setLastActiveNotebookId(notebookId: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (notebookId) {
      localStorage.setItem(STORAGE_KEYS.LAST_NOTEBOOK, notebookId)
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_NOTEBOOK)
    }
  } catch {}
}

/**
 * Get the last active thread for a given notebook.
 */
export function getLastActiveThreadId(notebookId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(`${STORAGE_KEYS.LAST_THREAD}_${notebookId}`)
  } catch {
    return null
  }
}

/**
 * Set the last active thread for a given notebook.
 */
export function setLastActiveThreadId(notebookId: string, threadId: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const key = `${STORAGE_KEYS.LAST_THREAD}_${notebookId}`
    if (threadId) {
      localStorage.setItem(key, threadId)
    } else {
      localStorage.removeItem(key)
    }
  } catch {}
}

/**
 * Get persisted document selections for a notebook.
 */
export function getPersistedDocSelection(notebookId: string): Record<string, boolean> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SELECTION_PREFIX}${notebookId}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

/**
 * Persist document selections for a notebook.
 */
export function setPersistedDocSelection(notebookId: string, selection: Record<string, boolean>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.SELECTION_PREFIX}${notebookId}`,
      JSON.stringify(selection)
    )
  } catch {}
}

/**
 * Wipe all user workspace caches on logout or account switch so no private data leaks.
 */
export function clearUserWorkState(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEYS.LAST_NOTEBOOK)
    localStorage.removeItem(STORAGE_KEYS.PENDING_DESTINATION)
    sessionStorage.removeItem(STORAGE_KEYS.PENDING_DESTINATION)

    // Remove all thread & selection caches
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith(STORAGE_KEYS.SELECTION_PREFIX) || k.startsWith(STORAGE_KEYS.LAST_THREAD))) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  } catch (err) {
    console.warn('[Routing] Failed to clear user work state:', err)
  }
}

/**
 * Parse query parameters from both search string and hash string.
 */
function extractQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {}
  try {
    const queryIdx = url.indexOf('?')
    if (queryIdx !== -1) {
      const queryString = url.slice(queryIdx + 1).split('#')[0]
      const searchParams = new URLSearchParams(queryString)
      searchParams.forEach((val, key) => {
        params[key] = val
      })
    }
  } catch {}
  return params
}

/**
 * Pure route parser that extracts view, notebookId, threadId, and sectionId from current browser URL.
 * Works seamlessly with both path-based routing (/notebook/xyz, /dashboard) and hash-based routing (#/notebook/xyz, #dashboard).
 */
export function parseCurrentRoute(): ParsedRoute {
  if (typeof window === 'undefined') {
    return {
      view: 'landing',
      notebookId: null,
      threadId: null,
      sectionId: null,
      isAuthCallback: false,
      rawPath: '/',
      queryParams: {},
    }
  }

  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const hash = window.location.hash.replace(/^#\/?/, '')
  const queryParams = {
    ...extractQueryParams(window.location.search),
    ...extractQueryParams(window.location.hash),
  }

  // Check for OAuth callback route
  if (pathname === '/auth/callback' || hash.startsWith('auth/callback')) {
    return {
      view: 'landing',
      notebookId: null,
      threadId: null,
      sectionId: null,
      isAuthCallback: true,
      rawPath: pathname,
      queryParams,
    }
  }

  // 1. Check path-based routing first
  if (pathname === '/dashboard') {
    return {
      view: 'dashboard',
      notebookId: null,
      threadId: null,
      sectionId: null,
      isAuthCallback: false,
      rawPath: '/dashboard',
      queryParams,
    }
  }

  if (pathname.startsWith('/notebook/')) {
    const segments = pathname.replace('/notebook/', '').split('/')
    const notebookId = decodeURIComponent(segments[0] || '').trim() || null
    const threadId = queryParams.thread || (segments[1] ? decodeURIComponent(segments[1]) : null)
    return {
      view: 'workspace',
      notebookId,
      threadId: threadId || (notebookId ? getLastActiveThreadId(notebookId) : null),
      sectionId: null,
      isAuthCallback: false,
      rawPath: pathname,
      queryParams,
    }
  }

  if (pathname === '/workspace') {
    const lastNb = getLastActiveNotebookId()
    return {
      view: 'workspace',
      notebookId: lastNb,
      threadId: queryParams.thread || (lastNb ? getLastActiveThreadId(lastNb) : null),
      sectionId: null,
      isAuthCallback: false,
      rawPath: '/workspace',
      queryParams,
    }
  }

  // 2. Check hash-based routing next
  // Clean hash might look like: "dashboard", "notebook/123", "notebook/123?thread=abc", "features"
  const cleanHash = hash.split('?')[0].replace(/^\/+/, '')

  if (cleanHash === 'dashboard') {
    return {
      view: 'dashboard',
      notebookId: null,
      threadId: null,
      sectionId: null,
      isAuthCallback: false,
      rawPath: '#dashboard',
      queryParams,
    }
  }

  if (cleanHash.startsWith('notebook/')) {
    const rawNb = cleanHash.replace('notebook/', '').split('/')[0]
    const notebookId = decodeURIComponent(rawNb).trim() || null
    const threadId = queryParams.thread || (notebookId ? getLastActiveThreadId(notebookId) : null)
    return {
      view: 'workspace',
      notebookId,
      threadId,
      sectionId: null,
      isAuthCallback: false,
      rawPath: `#notebook/${notebookId || ''}`,
      queryParams,
    }
  }

  if (cleanHash === 'workspace') {
    const lastNb = getLastActiveNotebookId()
    return {
      view: 'workspace',
      notebookId: lastNb,
      threadId: queryParams.thread || (lastNb ? getLastActiveThreadId(lastNb) : null),
      sectionId: null,
      isAuthCallback: false,
      rawPath: '#workspace',
      queryParams,
    }
  }

  // Landing page section anchors
  if (['features', 'architecture', 'benchmarks', 'faq'].includes(cleanHash)) {
    return {
      view: 'landing',
      notebookId: null,
      threadId: null,
      sectionId: cleanHash,
      isAuthCallback: false,
      rawPath: `#${cleanHash}`,
      queryParams,
    }
  }

  // Default: Landing page
  return {
    view: 'landing',
    notebookId: null,
    threadId: null,
    sectionId: null,
    isAuthCallback: false,
    rawPath: pathname,
    queryParams,
  }
}

/**
 * Synchronize browser address bar with current application view without breaking history or reloading.
 */
export function updateBrowserUrl(
  view: AppView,
  activeNotebookId?: string | null,
  activeThreadId?: string | null,
  replace: boolean = false
): void {
  if (typeof window === 'undefined') return

  let targetUrl = ''
  if (view === 'landing') {
    const currentHash = window.location.hash.replace(/^#\/?/, '').split('?')[0]
    if (['features', 'architecture', 'benchmarks', 'faq'].includes(currentHash)) {
      targetUrl = `#${currentHash}`
    } else {
      targetUrl = '#landing'
    }
  } else if (view === 'dashboard') {
    targetUrl = '#dashboard'
  } else if (view === 'workspace' && activeNotebookId) {
    targetUrl = `#notebook/${activeNotebookId}`
    if (activeThreadId) {
      targetUrl += `?thread=${encodeURIComponent(activeThreadId)}`
    }
  } else {
    targetUrl = '#landing'
  }

  const currentFullHash = window.location.hash
  if (currentFullHash !== targetUrl) {
    if (replace && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', targetUrl)
    } else {
      window.location.hash = targetUrl
    }
  }
}
