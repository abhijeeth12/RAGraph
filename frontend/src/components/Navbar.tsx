'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, Upload, CheckCircle, Loader2, AlertCircle, User, LogOut, LogIn } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { useRef, useState, useEffect } from 'react'
import { uploadDocument, pollIngestionStatus } from '@/lib/api'
import type { UploadResponse } from '@/lib/types'
import AuthModal from './AuthModal'

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { sidebarOpen, toggleSidebar, backendOnline, user } = useSearchStore()
  const logout = useSearchStore((s) => s.logout)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadLabel, setUploadLabel] = useState('')
  const [authOpen, setAuthOpen] = useState(false)

  // ✅ hydration fix
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploadState('uploading')
    setUploadLabel(`Uploading ${file.name}…`)

    try {
      const ownerId = useSearchStore.getState().getOwnerId()
      const res = await uploadDocument(ownerId, file, (pct) => {
        setUploadLabel(`Uploading ${pct}%`)
      })

      setUploadState('processing')
      setUploadLabel('Processing…')

      let status: { status: string; node_count?: number; image_count?: number; error?: string }
      let attempts = 0
      do {
        await new Promise((r) => setTimeout(r, 1500))
        status = await pollIngestionStatus(ownerId, res.doc_id)
        attempts++
        if (status.status === 'parsing')   setUploadLabel('Parsing…')
        if (status.status === 'embedding') setUploadLabel('Embedding…')
        if (status.status === 'indexing')  setUploadLabel('Indexing…')
      } while (
        status.status !== 'done' && status.status !== 'error' && attempts < 60
      )

      if (status.status === 'done') {
        setUploadState('done')
        setUploadLabel(
          `${file.name} — ${status.node_count} chunks, ${status.image_count} images`
        )
        setTimeout(() => { setUploadState('idle'); setUploadLabel('') }, 4000)
      } else {
        throw new Error(status.error ?? 'Ingestion failed')
      }
    } catch (err: unknown) {
      setUploadState('error')
      setUploadLabel(err instanceof Error ? err.message : 'Upload failed')
      setTimeout(() => { setUploadState('idle'); setUploadLabel('') }, 4000)
    }
  }

  const uploadIcon = {
    idle:       <Upload size={13} />,
    uploading:  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />,
    processing: <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />,
    done:       <CheckCircle size={13} style={{ color: 'var(--accent-green)' }} />,
    error:      <AlertCircle size={13} style={{ color: '#ef4444' }} />,
  }[uploadState]

  return (
    <>
      <header style={{
        height: 52, background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 10,
        position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
      }}>
        {!sidebarOpen && (
          <button onClick={toggleSidebar} className="btn-ghost" style={{ padding: '6px 8px' }}>
            <Menu size={16} />
          </button>
        )}
        {!sidebarOpen && (
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 17,
            fontWeight: 400, letterSpacing: '-0.02em',
          }}>
            RAGraph
          </h1>
        )}

        <div style={{ flex: 1 }} />

        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: backendOnline ? 'var(--accent-green)' : '#ef4444',
          boxShadow: backendOnline ? '0 0 0 2px rgba(22,163,74,0.2)' : '0 0 0 2px rgba(239,68,68,0.2)',
        }} title={backendOnline ? 'Backend online' : 'Backend offline'} />

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.docx,.pptx"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploadState === 'uploading' || uploadState === 'processing'}
          className="btn-ghost"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', fontSize: 12.5,
            opacity: (uploadState === 'uploading' || uploadState === 'processing') ? 0.7 : 1,
            maxWidth: 260, overflow: 'hidden',
          }}
        >
          {uploadIcon}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {uploadLabel || 'Upload doc'}
          </span>
        </button>

        {/* Auth buttons */}
        {mounted && (
          user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={12} /> {user.email}
              </span>
              <button className="btn-auth-ghost" onClick={logout}>
                <LogOut size={12} /> Logout
              </button>
            </div>
          ) : (
            <button className="btn-auth" onClick={() => setAuthOpen(true)}>
              <LogIn size={12} /> Login
            </button>
          )
        )}

        {/* ✅ FIXED THEME TOGGLE */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="btn-ghost"
          style={{ padding: '6px 8px' }}
          title="Toggle theme"
        >
          {mounted ? (
            theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />
          ) : (
            <div style={{ width: 15, height: 15 }} />
          )}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}