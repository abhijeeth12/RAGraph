'use client'
import { Plus, LineChart, Share2, Settings, User, LogOut, LogIn, AudioLines } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { useState, useEffect } from 'react'
import AuthModal from './AuthModal'

export function Navbar() {
  const { user, threads, currentThreadId } = useSearchStore()
  const logout = useSearchStore((s) => s.logout)
  const [authOpen, setAuthOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentThread = threads.find(t => t.id === currentThreadId)
  const title = currentThread ? currentThread.title : "Untitled notebook"

  return (
    <>
      <header style={{
        height: 64,
        background: 'var(--bg-app)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
        width: '100%'
      }}>
        {/* App Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <div style={{
            width: 32,
            height: 32,
            background: 'var(--text-primary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--bg-app)'
          }}>
            <AudioLines size={18} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 400,
            color: 'var(--text-primary)'
          }}>
            {title}
          </h1>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            className="btn-primary" 
            style={{ borderRadius: 24, padding: '8px 20px', gap: 8 }}
            onClick={() => useSearchStore.getState().setCurrentThreadId(null)}
          >
            <Plus size={16} /> Create notebook
          </button>
          
          <button className="btn-ghost">
            <LineChart size={16} /> Analytics
          </button>
          
          <button className="btn-ghost">
            <Share2 size={16} /> Share
          </button>
          
          <button className="btn-ghost">
            <Settings size={16} /> Settings
          </button>

          {/* Auth controls */}
          {mounted && (
            user ? (
              <button className="btn-ghost" onClick={logout} style={{ marginLeft: 8, padding: 8, borderRadius: '50%' }} title={`Logout ${user.email}`}>
                <User size={18} />
              </button>
            ) : (
              <button className="btn-ghost" onClick={() => setAuthOpen(true)} style={{ marginLeft: 8 }}>
                <LogIn size={16} /> Login
              </button>
            )
          )}
        </div>
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}