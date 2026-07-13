'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Globe, Search, Loader2, CheckCircle, AlertCircle, CheckSquare, Square, FileText, PanelLeftClose } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { uploadDocument, pollIngestionStatus, listDocuments } from '@/lib/api'

export function SourcesPanel() {
  const store = useSearchStore()
  const { documents, setDocuments, isUploading: uploading, setUploading, uploadPct, setUploadPct } = store
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await listDocuments()
      setDocuments(data.documents)
    } catch { /* backend might not be ready */ }
  }, [setDocuments])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 3000)
    return () => clearInterval(interval)
  }, [refresh])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''
    setUploading(true)

    for (const file of files) {
      try {
        setUploadPct(0)
        const res = await uploadDocument(file, (pct) => setUploadPct(pct))
        let attempts = 0
        while (attempts < 120) {
          await new Promise(r => setTimeout(r, 1500))
          const status = await pollIngestionStatus(res.doc_id)
          await refresh()
          if (status.status === 'done' || status.status === 'error') break
          attempts++
        }
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
    setUploading(false)
    await refresh()
  }

  return (
    <div className="panel-container" style={{ width: 320, height: '100%', padding: '20px 0' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          Sources
        </h2>
        <button className="btn-ghost" style={{ padding: 6, border: 'none' }}>
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* Add Sources Area */}
      <div style={{ padding: '0 20px' }}>
        <input
          ref={fileRef} type="file" multiple
          accept=".pdf,.txt,.md,.docx,.pptx"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px',
            background: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
            opacity: uploading ? 0.7 : 1,
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => {
            if(!uploading) e.currentTarget.style.background = 'var(--bg-hover)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {uploading
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing {uploadPct}%…</>
            : <><Plus size={16} /> Add sources</>
          }
        </button>

        {/* Dummy Search Web Input */}
        <div style={{
          marginTop: 16,
          background: 'var(--bg-app)',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 12px',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, marginLeft: 4 }}>
            Search the web for new sources
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: 'none', fontSize: 12, padding: '4px 10px' }}>
              <Globe size={14} /> Web
            </button>
            <button className="btn-ghost" style={{ border: 'none', fontSize: 12, padding: '4px 10px' }}>
              <Search size={14} /> Fast Research
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn-ghost" style={{ padding: 4, borderRadius: '50%', border: 'none', background: 'var(--bg-hover)' }}>
              <Search size={14} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <Loader2 size={14} style={{ marginRight: 4 }}/> {/* Placeholder for refresh icon */}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontSize: 13 }}>
          Select all
          <CheckSquare size={16} fill="var(--text-primary)" color="var(--bg-panel)" />
        </div>
      </div>

      {/* Document List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 12px' }}>
        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)' }}>
            <FileText size={24} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: 13 }}>Saved sources will appear here</p>
          </div>
        ) : (
          <AnimatePresence>
            {documents.map((doc, idx) => (
              <motion.div
                key={`doc-item-${idx}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px', borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Icon based on status */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {doc.status === 'done' ? (
                     <Globe size={12} color="var(--accent-blue)" />
                  ) : doc.status === 'error' ? (
                     <AlertCircle size={12} color="#ef4444" />
                  ) : (
                     <Loader2 size={12} className="animate-spin" color="var(--accent-amber)" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {doc.filename}
                  </p>
                </div>
                
                <CheckSquare size={16} color="var(--text-muted)" />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
