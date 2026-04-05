'use client'
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
      onClose()
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
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to redirect to Google')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="auth-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="auth-close" onClick={onClose}>
              <X size={18} />
            </button>

            <div className="auth-header">
              <h2>Welcome to RAGraph</h2>
              <p>Sign in to persist your documents across sessions</p>
            </div>

            <div className="auth-tabs">
              <button
                className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                onClick={() => { setTab('login'); setError('') }}
              >
                <LogIn size={14} />
                Login
              </button>
              <button
                className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
                onClick={() => { setTab('signup'); setError('') }}
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

              {error && (
                <div className="auth-error">{error}</div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', width: '100%' }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
                <span style={{ padding: '0 10px', fontSize: 12, color: 'var(--text-muted)' }}>OR</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="auth-submit"
                style={{
                  background: 'white',
                  color: 'black',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                disabled={loading}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 16, height: 16 }} />
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
