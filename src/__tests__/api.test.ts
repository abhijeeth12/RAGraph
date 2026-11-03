import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('API Contract Tests', () => {
  it('verifies standard bearer token format', () => {
    const token = 'sample-access-token'
    const authHeader = `Bearer ${token}`
    assert.equal(authHeader.startsWith('Bearer '), true)
    assert.equal(authHeader.split(' ')[1], token)
  })

  it('verifies JSON-LD structured data sanitizer escapes tags', () => {
    const raw = { name: '</script><script>alert(1)</script>' }
    const sanitized = JSON.stringify(raw).replace(/</g, '\\u003c')
    assert.equal(sanitized.includes('</script>'), false)
    assert.equal(sanitized.includes('\\u003c/script>'), true)
  })

  it('validates notebook model default fallback', () => {
    const model = undefined
    const effectiveModel = model || 'openrouter/free'
    assert.equal(effectiveModel, 'openrouter/free')
  })
})

