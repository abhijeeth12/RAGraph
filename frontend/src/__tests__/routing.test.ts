import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { parseCurrentRoute, updateBrowserUrl } from '../lib/routing.ts'

describe('Browser History & Routing Navigation Tests', () => {
  let pushStateCalls: Array<{ data: any; title: string; url: string }> = []
  let replaceStateCalls: Array<{ data: any; title: string; url: string }> = []

  beforeEach(() => {
    pushStateCalls = []
    replaceStateCalls = []

    // Mock window & location
    const locationObj = {
      pathname: '/',
      hash: '',
      search: '',
    }

    const historyObj = {
      pushState(data: any, title: string, url: string) {
        pushStateCalls.push({ data, title, url })
        if (url.startsWith('#')) {
          locationObj.hash = url
        } else if (url.startsWith('/')) {
          locationObj.pathname = url
          locationObj.hash = ''
        }
      },
      replaceState(data: any, title: string, url: string) {
        replaceStateCalls.push({ data, title, url })
        if (url.startsWith('#')) {
          locationObj.hash = url
        } else if (url.startsWith('/')) {
          locationObj.pathname = url
          locationObj.hash = ''
        }
      },
    }

    // @ts-ignore
    globalThis.window = {
      location: locationObj,
      history: historyObj,
    } as any
  })

  it('preserves clean root / on initial mount without forcing #landing', () => {
    window.location.pathname = '/'
    window.location.hash = ''

    updateBrowserUrl('landing', null, null, true)

    assert.strictEqual(pushStateCalls.length, 0, 'Should not pushState on initial mount')
    assert.strictEqual(replaceStateCalls.length, 0, 'Should not replace clean root / with #landing')
    assert.strictEqual(window.location.hash, '')
  })

  it('pushes a new history entry when navigating to dashboard from landing', () => {
    window.location.pathname = '/'
    window.location.hash = ''

    updateBrowserUrl('dashboard', null, null, false)

    assert.strictEqual(pushStateCalls.length, 1, 'Should call pushState when navigating to dashboard')
    assert.strictEqual(pushStateCalls[0].url, '#dashboard')
    assert.strictEqual(replaceStateCalls.length, 0, 'Should not use replaceState on user navigation')
  })

  it('pushes a new history entry when navigating from dashboard to notebook workspace', () => {
    window.location.pathname = '/'
    window.location.hash = '#dashboard'

    updateBrowserUrl('workspace', 'nb-tree-rag', null, false)

    assert.strictEqual(pushStateCalls.length, 1, 'Should call pushState when opening notebook')
    assert.strictEqual(pushStateCalls[0].url, '#notebook/nb-tree-rag')
    assert.strictEqual(replaceStateCalls.length, 0)
  })

  it('does NOT push or replace when browser Back/Forward (popstate) already set the URL', () => {
    // Simulating: user clicked Back to #dashboard, so window.location.hash is already #dashboard
    window.location.pathname = '/'
    window.location.hash = '#dashboard'

    // When the component synchronizes back-navigation state:
    updateBrowserUrl('dashboard', null, null, true)

    assert.strictEqual(pushStateCalls.length, 0, 'Must not push on popstate traversal')
    assert.strictEqual(replaceStateCalls.length, 0, 'Must not replace when URL already matches target')
  })

  it('replaces in-place when only thread changes in the same notebook workspace', () => {
    window.location.pathname = '/'
    window.location.hash = '#notebook/nb-1'

    updateBrowserUrl('workspace', 'nb-1', 'thread-999', true)

    assert.strictEqual(pushStateCalls.length, 0, 'Should not push on thread selection')
    assert.strictEqual(replaceStateCalls.length, 1, 'Should replace in-place for thread selection')
    assert.strictEqual(replaceStateCalls[0].url, '#notebook/nb-1?thread=thread-999')
  })

  it('parses direct path-based URLs correctly without unexpected redirects', () => {
    window.location.pathname = '/notebook/my-doc-1'
    window.location.hash = ''

    const route = parseCurrentRoute()
    assert.strictEqual(route.view, 'workspace')
    assert.strictEqual(route.notebookId, 'my-doc-1')
  })

  it('parses hash-based URLs correctly across back/forward navigation', () => {
    window.location.pathname = '/'
    window.location.hash = '#notebook/nb-tree-rag?thread=th-1'

    const route = parseCurrentRoute()
    assert.strictEqual(route.view, 'workspace')
    assert.strictEqual(route.notebookId, 'nb-tree-rag')
    assert.strictEqual(route.threadId, 'th-1')
  })
})
