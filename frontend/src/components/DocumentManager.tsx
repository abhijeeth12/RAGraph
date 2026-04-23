'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Trash2, Eye, FileText, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { uploadDocument, pollIngestionStatus, listDocuments, deleteDocument, getDocumentContent } from '@/lib/api'
import type { DocumentInfo } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = {
  queued:    'Queued',
  parsing:   'Parsing…',
  embedding: 'Embedding…',
  indexing:  'Indexing…',
  done:      'Ready',
  error:     'Error',
}

const STATUS_COLOR: Record<string, string> = {
  queued:    'var(--text-muted)',
  parsing:   'var(--accent-amber)',
  embedding: 'var(--accent-blue)',
  indexing:  'var(--accent-blue)',
  done:      'var(--accent-green)',
  error:     '#ef4444',
}

interface Props {
  onClose?: () => void
}

export function DocumentManager({ onClose }: Props) {
  const store = useSearchStore()
  const { documents, setDocuments, isUploading: uploading, setUploading, uploadPct, setUploadPct } = store
  const [viewer, setViewer] = useState<{ doc: DocumentInfo; content: string } | null>(null)
  const [loadingView, setLoadingView] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)


  // Refresh document list
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
        // Poll until done
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

  const handleDelete = async (doc: DocumentInfo) => {
    if (!confirm(`Delete [Doc ${doc.number}] ${doc.filename}?`)) return
    try {
      await deleteDocument(doc.doc_id)
      await refresh()
    } catch (err) {
      alert('Delete failed: ' + err)
    }
  }

  const handleView = async (doc: DocumentInfo) => {
    setLoadingView(doc.doc_id)
    try {
      const content = await getDocumentContent(doc.doc_id)
      setViewer({ doc, content })
    } catch (err) {
      alert('Could not load document: ' + err)
    } finally {
      setLoadingView(null)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }

  if (!store.getOwnerId()) return <div>Loading session...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <h2 style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>Documents</h2>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {documents.length} file{documents.length !== 1 ? 's' : ''}
        </span>
        {onClose && (
          <button onClick={onClose} className="btn-ghost" style={{ padding: '4px 6px' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Upload button */}
      <div style={{ padding: '12px 12px 6px' }}>
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
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            padding: '9px 12px',
            background: 'var(--text-primary)', color: 'var(--bg-primary)',
            border: 'none', borderRadius: 8, cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)',
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading
            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                Processing {uploadPct}%…</>
            : <><Upload size={13} /> Upload documents</>
          }
        </button>
      </div>

      {/* Document list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
        {documents.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 16px',
            color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.6,
          }}>
            <FileText size={28} style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }} />
            No documents yet.<br />Upload PDFs, TXT, DOCX, PPTX.
          </div>
        ) : (
          <AnimatePresence>
            {documents.map((doc, idx) => {
              const isProcessing = ['queued', 'parsing', 'embedding', 'indexing'].includes(doc.status)
              return (
                <motion.div
                  key={`doc-item-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '8px 10px', borderRadius: 6, marginBottom: 4,
                    background: 'transparent',
                    border: '1px solid transparent',
                    transition: 'background 0.15s, border 0.15s',
                  }}
                >
                  {/* Number badge */}
                  <div style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                    background: doc.status === 'done' ? 'var(--accent-blue)' : 'var(--bg-hover)',
                    color: doc.status === 'done' ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, marginTop: 1,
                  }}>
                    {doc.number}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                    }}>
                      {doc.filename}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      {isProcessing
                        ? <Loader2 size={10} style={{
                            color: STATUS_COLOR[doc.status],
                            animation: 'spin 1s linear infinite',
                          }} />
                        : doc.status === 'done'
                          ? <CheckCircle size={10} style={{ color: STATUS_COLOR.done }} />
                          : <AlertCircle size={10} style={{ color: STATUS_COLOR.error }} />
                      }
                      <span style={{ fontSize: 10.5, color: STATUS_COLOR[doc.status] }}>
                        {STATUS_LABELS[doc.status]}
                      </span>
                      {doc.status === 'done' && (
                        <>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>·</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {doc.node_count} chunks · {formatSize(doc.size_bytes)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {doc.status === 'done' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleView(doc) }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', padding: 3, borderRadius: 4,
                          display: 'flex',
                        }}
                        title="View document"
                      >
                        {loadingView === doc.doc_id
                          ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Eye size={12} />
                        }
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc) }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 3, borderRadius: 4,
                        display: 'flex',
                      }}
                      title="Delete document"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Document viewer modal */}
      <AnimatePresence>
        {viewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              zIndex: 200, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: 24,
            }}
            onClick={() => setViewer(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)', borderRadius: 12,
                width: '100%', maxWidth: 760, maxHeight: '80vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {/* Viewer header */}
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  background: 'var(--accent-blue)', color: 'white',
                  borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700,
                }}>
                  Doc {viewer.doc.number}
                </span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
                  {viewer.doc.filename}
                </span>
                <button onClick={() => setViewer(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                           color: 'var(--text-muted)', display: 'flex' }}>
                  <X size={16} />
                </button>
              </div>
              {/* Content */}
              <pre style={{
                flex: 1, overflow: 'auto', padding: '16px 18px',
                fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7,
                color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {viewer.content}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
