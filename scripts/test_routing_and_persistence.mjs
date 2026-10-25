/**
 * Automated Test Suite for RAGraph Routing, Session Management, and Work Persistence
 */
import assert from 'node:assert/strict'
import test from 'node:test'

// Mock DOM environment for Node.js test execution
class LocalStorageMock {
  constructor() {
    this.store = new Map()
  }
  getItem(key) {
    return this.store.get(key) ?? null
  }
  setItem(key, value) {
    this.store.set(key, String(value))
  }
  removeItem(key) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
  get length() {
    return this.store.size
  }
  key(index) {
    return Array.from(this.store.keys())[index] ?? null
  }
}

globalThis.localStorage = new LocalStorageMock()
globalThis.sessionStorage = new LocalStorageMock()

// Helper to set mock window location
function setMockLocation(pathname = '/', hash = '', search = '') {
  globalThis.window = {
    location: {
      pathname,
      hash,
      search,
    },
    history: {
      replaceState: (state, title, url) => {
        if (url.startsWith('#')) {
          globalThis.window.location.hash = url
        }
      },
      pushState: (state, title, url) => {
        if (url.startsWith('#')) {
          globalThis.window.location.hash = url
        }
      },
    },
  }
}

// Dynamically import the routing module compiled or run via node
test('Routing & Persistence Suite', async (t) => {
  // Reset storage
  localStorage.clear()
  sessionStorage.clear()
  setMockLocation('/', '', '')

  // Dynamically import routing from dist or src
  // We can test the exact pure logic of parseCurrentRoute and storage helpers
  const {
    parseCurrentRoute,
    STORAGE_KEYS,
    getStoredAuth,
    getPendingAuthDestination,
    setPendingAuthDestination,
    getLastActiveNotebookId,
    setLastActiveNotebookId,
    getLastActiveThreadId,
    setLastActiveThreadId,
    getPersistedDocSelection,
    setPersistedDocSelection,
    clearUserWorkState,
    updateBrowserUrl,
  } = await import('../src/lib/routing.ts')

  await t.test('1. Default route: root / with no hash returns landing view', () => {
    setMockLocation('/', '', '')
    const route = parseCurrentRoute()
    assert.equal(route.view, 'landing')
    assert.equal(route.notebookId, null)
    assert.equal(route.threadId, null)
  })

  await t.test('2. Path routing: /dashboard returns dashboard view', () => {
    setMockLocation('/dashboard', '', '')
    const route = parseCurrentRoute()
    assert.equal(route.view, 'dashboard')
    assert.equal(route.notebookId, null)
  })

  await t.test('3. Hash routing: #dashboard returns dashboard view', () => {
    setMockLocation('/', '#dashboard', '')
    const route = parseCurrentRoute()
    assert.equal(route.view, 'dashboard')
  })

  await t.test('4. Hash routing: #/dashboard returns dashboard view', () => {
    setMockLocation('/', '#/dashboard', '')
    const route = parseCurrentRoute()
    assert.equal(route.view, 'dashboard')
  })

  await t.test('5. Path routing: /notebook/nb-tech-123 returns workspace view and notebookId', () => {
    setMockLocation('/notebook/nb-tech-123', '', '')
    const route = parseCurrentRoute()
    assert.equal(route.view, 'workspace')
    assert.equal(route.notebookId, 'nb-tech-123')
  })

  await t.test('6. Hash routing: #notebook/nb-tech-123 returns workspace view and notebookId', () => {
    setMockLocation('/', '#notebook/nb-tech-123', '')
    const route = parseCurrentRoute()
    assert.equal(route.view, 'workspace')
    assert.equal(route.notebookId, 'nb-tech-123')
  })

  await t.test('7. Hash routing: #/notebook/nb-tech-123 returns workspace view and notebookId', () => {
    setMockLocation('/', '#/notebook/nb-tech-123', '')
    const route = parseCurrentRoute()
    assert.equal(route.view, 'workspace')
    assert.equal(route.notebookId, 'nb-tech-123')
  })

  await t.test('8. Query parameter preservation: ?thread=conv-999 restores active thread', () => {
    setMockLocation('/notebook/nb-123', '', '?thread=conv-999')
    const route = parseCurrentRoute()
    assert.equal(route.view, 'workspace')
    assert.equal(route.notebookId, 'nb-123')
    assert.equal(route.threadId, 'conv-999')
  })

  await t.test('9. Hash query parameter: #notebook/nb-123?thread=conv-888 restores thread', () => {
    setMockLocation('/', '#notebook/nb-123?thread=conv-888', '')
    const route = parseCurrentRoute()
    assert.equal(route.view, 'workspace')
    assert.equal(route.notebookId, 'nb-123')
    assert.equal(route.threadId, 'conv-888')
  })

  await t.test('10. Landing section anchors: #features, #architecture, #benchmarks, #faq', () => {
    for (const sec of ['features', 'architecture', 'benchmarks', 'faq']) {
      setMockLocation('/', `#${sec}`, '')
      const route = parseCurrentRoute()
      assert.equal(route.view, 'landing')
      assert.equal(route.sectionId, sec)
    }
  })

  await t.test('11. Auth callback route detection: /auth/callback', () => {
    setMockLocation('/auth/callback', '', '?code=test-auth-code')
    const route = parseCurrentRoute()
    assert.equal(route.isAuthCallback, true)
    assert.equal(route.queryParams.code, 'test-auth-code')
  })

  await t.test('12. Stored Auth persistence & recovery', () => {
    localStorage.clear()
    assert.equal(getStoredAuth(), null)

    const mockSession = {
      user: { user_id: 'usr-42', email: 'alice@example.com' },
      token: 'jwt-access-token-xyz',
      refreshToken: 'jwt-refresh-token-abc',
    }
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(mockSession))

    const recovered = getStoredAuth()
    assert.deepEqual(recovered, mockSession)
  })

  await t.test('13. Pending auth destination persistence across tabs & OAuth flows', () => {
    localStorage.clear()
    sessionStorage.clear()
    assert.equal(getPendingAuthDestination(), null)

    setPendingAuthDestination('notebook/nb-research?thread=conv-deep')
    assert.equal(getPendingAuthDestination(), 'notebook/nb-research?thread=conv-deep')

    setPendingAuthDestination(null)
    assert.equal(getPendingAuthDestination(), null)
  })

  await t.test('14. Active workspace and per-notebook thread tracking', () => {
    localStorage.clear()
    assert.equal(getLastActiveNotebookId(), null)

    setLastActiveNotebookId('nb-finance')
    assert.equal(getLastActiveNotebookId(), 'nb-finance')

    setLastActiveThreadId('nb-finance', 'conv-q3-earnings')
    assert.equal(getLastActiveThreadId('nb-finance'), 'conv-q3-earnings')
    assert.equal(getLastActiveThreadId('nb-other'), null)
  })

  await t.test('15. Document selection persistence per notebook', () => {
    localStorage.clear()
    assert.equal(getPersistedDocSelection('nb-1'), null)

    const sel = { 'doc-1': true, 'doc-2': false, 'doc-3': true }
    setPersistedDocSelection('nb-1', sel)
    assert.deepEqual(getPersistedDocSelection('nb-1'), sel)
    assert.equal(getPersistedDocSelection('nb-2'), null)
  })

  await t.test('16. User isolation & complete cache purge on logout', () => {
    setLastActiveNotebookId('nb-private')
    setLastActiveThreadId('nb-private', 'conv-confidential')
    setPersistedDocSelection('nb-private', { 'doc-secret': true })
    setPendingAuthDestination('dashboard')

    clearUserWorkState()

    assert.equal(getLastActiveNotebookId(), null)
    assert.equal(getLastActiveThreadId('nb-private'), null)
    assert.equal(getPersistedDocSelection('nb-private'), null)
    assert.equal(getPendingAuthDestination(), null)
  })

  await t.test('17. URL synchronization without destructive overwrite', () => {
    setMockLocation('/', '#notebook/nb-1', '')
    updateBrowserUrl('workspace', 'nb-1', 'conv-10', true)
    assert.equal(globalThis.window.location.hash, '#notebook/nb-1?thread=conv-10')

    updateBrowserUrl('dashboard', null, null, true)
    assert.equal(globalThis.window.location.hash, '#dashboard')

    updateBrowserUrl('landing', null, null, true)
    assert.equal(globalThis.window.location.hash, '#landing')
  })
})
