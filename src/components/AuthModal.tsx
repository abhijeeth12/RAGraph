import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import { login, signup, cleanupSession, getGoogleAuthUrl } from '@/lib/api'
import { useSearchStore } from '@/store/useSearchStore'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setUser = useSearchStore((s) => s.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const fn = tab === 'login' ? login : signup
      const result = await fn(email, password)

      const state = useSearchStore.getState()
      if (!state.user && state.session_id) {
        cleanupSession(state.session_id).catch(() => {})
      }

      setUser(
        { user_id: result.user.user_id, email: result.user.email },
        result.access_token
      )
      setEmail('')
      setPassword('')
      
      const destination = state.pendingAuthDestination || 'dashboard'
      state.setPendingAuthDestination(null)
      state.setAuthModalOpen(false)
      onClose()

      if (destination === 'dashboard') {
        state.setAppView('dashboard')
        if (typeof window !== 'undefined') {
          window.location.hash = 'dashboard'
        }
      } else if (destination.startsWith('notebook/')) {
        const nbId = destination.replace('notebook/', '')
        state.setActiveNotebookId(nbId)
        state.setAppView('workspace')
        if (typeof window !== 'undefined') {
          window.location.hash = destination
        }
      } else {
        state.setAppView('dashboard')
        if (typeof window !== 'undefined') {
          window.location.hash = 'dashboard'
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const data = await getGoogleAuthUrl()
      if (data?.url) {
        window.location.href = data.url
      } else {
        setError('Google Sign-In is not configured on this server. Please use email and password.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to redirect to Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-overlay"
          className="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="auth-modal auth-modal-permanent-dark dark"
            data-theme="dark"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#121417',
              color: '#F3F4F6',
              border: '2px solid #282C35',
            }}
          >
            <button className="auth-close" onClick={onClose} aria-label="Close authentication modal">
              <X size={18} />
            </button>

            <div className="auth-header" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <img
                  src="/logo.png"
                  alt="RAGraph Logo"
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.35))',
                  }}
                />
              </div>
              <h2 style={{ fontSize: 20, marginBottom: 8, color: '#FFFFFF', fontWeight: 700 }}>
                Welcome to RAGraph
              </h2>
              <p style={{ color: '#9CA3AF' }}>Sign in to persist your document trees and research notebooks</p>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setTab('login')
                  setError('')
                }}
              >
                <LogIn size={14} />
                Login
              </button>
              <button
                type="button"
                className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  setTab('signup')
                  setError('')
                }}
              >
                <UserPlus size={14} />
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <Mail size={16} />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="auth-field">
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '16px 0',
                  width: '100%',
                }}
              >
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #282C35' }} />
                <span style={{ padding: '0 10px', fontSize: 12, color: '#6B7280' }}>
                  OR
                </span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #282C35' }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="auth-google-btn"
                disabled={loading}
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  style={{ width: 16, height: 16 }}
                />
                Continue with Google
              </button>
            </form>

            <p className="auth-footer">
              {tab === 'login'
                ? 'No account? Click Sign Up above.'
                : 'Already have an account? Click Login above.'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
