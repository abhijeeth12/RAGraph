import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Trash2,
  Eye,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  CheckSquare,
  Square,
} from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import {
  uploadDocument,
  pollIngestionStatus,
  listDocuments,
  deleteDocument,
  cancelDocument,
  getDocumentContent,
} from '@/lib/api'
import type { DocumentInfo } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  parsing: 'Parsing…',
  embedding: 'Embedding…',
  indexing: 'Indexing…',
  done: 'Ready',
  error: 'Error',
}

const STATUS_COLOR: Record<string, string> = {
  queued: 'var(--text-muted)',
  parsing: 'var(--accent-amber)',
  embedding: 'var(--accent-blue)',
  indexing: 'var(--accent-blue)',
  done: 'var(--accent-green)',
  error: '#ef4444',
}

interface Props {
  onClose?: () => void
}

export function DocumentManager({ onClose }: Props) {
  const store = useSearchStore()
  const {
    documents,
    setDocuments,
    activeNotebookId,
    notebooks,
    isUploading: uploading,
    setUploading,
    uploadPct,
    setUploadPct,
    selectedDocuments,
    toggleDocumentSelection,
    selectAllDocuments,
  } = store
  const [viewer, setViewer] = useState<{ doc: DocumentInfo; content: string } | null>(null)
  const [loadingView, setLoadingView] = useState<string | null>(null)
  const [processingLabel, setProcessingLabel] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadAbortRef = useRef<AbortController | null>(null)
  const currentUploadingDocIdRef = useRef<string | null>(null)
  const isCancelledRef = useRef(false)

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId)

  const refresh = useCallback(async () => {
    if (!activeNotebookId) {
      setDocuments([])
      return
    }
    // The un-persisted guest demo is a client-only showcase; nothing to fetch.
    if (activeNotebook?.isGuestDemo && !activeNotebook?.persisted) {
      return
    }
    try {
      const data = await listDocuments(activeNotebookId)
      if (data?.documents) {
        setDocuments(data.documents)
      }
    } catch {
      // Backend may be offline
    }
  }, [activeNotebookId, activeNotebook, setDocuments])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  const handleCancelActiveUpload = async () => {
    isCancelledRef.current = true
    if (uploadAbortRef.current) {
      try { uploadAbortRef.current.abort() } catch { /* ignore */ }
      uploadAbortRef.current = null
    }
    const docId = currentUploadingDocIdRef.current
    if (docId) {
      await cancelDocument(docId)
      currentUploadingDocIdRef.current = null
    }
    setUploading(false)
    setUploadPct(0)
    setProcessingLabel(null)
    await refresh()
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''
    setUploading(true)
    setUploadError(null)
    isCancelledRef.current = false

    for (const file of files) {
      if (isCancelledRef.current) break
      const controller = new AbortController()
      uploadAbortRef.current = controller

      try {
        setUploadPct(0)
        setProcessingLabel(null)
        const res = await uploadDocument(
          file,
          activeNotebookId,
          (pct) => setUploadPct(pct),
          controller.signal
        )
        currentUploadingDocIdRef.current = res.doc_id
        await refresh()

        if (isCancelledRef.current) {
          await cancelDocument(res.doc_id)
          break
        }

        setProcessingLabel('Queued…')
        setUploadPct(100)
        let attempts = 0
        let lastStatus = 'queued'
        while (attempts < 60) {
          if (isCancelledRef.current) {
            await cancelDocument(res.doc_id)
            break
          }
          await new Promise((r) => setTimeout(r, 1000))
          if (isCancelledRef.current) break
          try {
            const status = await pollIngestionStatus(res.doc_id)
            if (status.status === 'cancelled') {
              break
            }
            lastStatus = status.status ?? lastStatus
            const labels: Record<string, string> = {
              queued: 'Queued…',
              parsing: 'Parsing…',
              embedding: 'Embedding…',
              indexing: 'Indexing…',
              done: 'Ready',
              error: 'Error',
            }
            setProcessingLabel(labels[lastStatus] ?? lastStatus)
            await refresh()
            if (lastStatus === 'done' || lastStatus === 'error' || lastStatus === 'cancelled') break
          } catch (err) {
            console.warn('Poll failed, retrying:', err)
          }
          attempts++
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || isCancelledRef.current) {
          console.log('Upload cancelled by user')
          break
        }
        console.error('Upload error:', err)
        setUploadError(err?.message || 'Upload failed. Please try again.')
      } finally {
        currentUploadingDocIdRef.current = null
        uploadAbortRef.current = null
      }
    }
    setUploading(false)
    setUploadPct(0)
    setProcessingLabel(null)
    await refresh()
  }

  const handleDelete = async (doc: DocumentInfo) => {
    // If this doc is the one currently in flight, cancel it immediately
    if (currentUploadingDocIdRef.current === doc.doc_id) {
      isCancelledRef.current = true
      if (uploadAbortRef.current) {
        try { uploadAbortRef.current.abort() } catch { /* ignore */ }
        uploadAbortRef.current = null
      }
      setUploading(false)
      setUploadPct(0)
      setProcessingLabel(null)
    }

    const isProcessing = ['queued', 'parsing', 'embedding', 'indexing'].includes(doc.status)
    if (!isProcessing && doc.status === 'done') {
      if (!window.confirm(`Delete [Doc ${doc.number}] ${doc.filename}?`)) return
    }

    try {
      await deleteDocument(doc.doc_id)
      await refresh()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleView = async (doc: DocumentInfo) => {
    setLoadingView(doc.doc_id)
    try {
      const res = await getDocumentContent(doc.doc_id)
      setViewer({ doc, content: res.content || doc.content || 'No content preview available' })
    } catch (err) {
      console.error('Could not load doc:', err)
    } finally {
      setLoadingView(null)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <h2 style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
          Documents
        </h2>

        {documents.length > 0 && (
          <button
            onClick={() => {
              const allSelected = documents.every((d) => selectedDocuments[d.doc_id])
              selectAllDocuments(documents.map((d) => d.doc_id), !allSelected)
            }}
            className="btn-ghost"
            style={{ padding: '4px 8px', fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}
          >
            {documents.every((d) => selectedDocuments[d.doc_id]) ? (
              <CheckSquare size={14} />
            ) : (
              <Square size={14} />
            )}
            <span>Select All</span>
          </button>
        )}

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
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.docx,.pptx,.json"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
        {uploading ? (
          <div style={{ display: 'flex', gap: 6, width: '100%' }}>
            <button
              disabled
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-hover)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 500,
                fontFamily: 'var(--font-body)',
              }}
            >
              <Loader2 size={13} className="animate-spin" />
              <span>{processingLabel || `Uploading ${uploadPct}%…`}</span>
            </button>
            <button
              onClick={handleCancelActiveUpload}
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                border: '1px solid rgba(239, 68, 68, 0.35)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Cancel active upload or processing"
            >
              <X size={13} />
              <span>Cancel</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '9px 12px',
              background: 'var(--text-primary)',
              color: 'var(--bg-app)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              transition: 'opacity 0.15s ease',
            }}
          >
            <Upload size={13} /> Upload documents
          </button>
        )}
        {uploadError && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              marginTop: 8,
              padding: '7px 9px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#f87171',
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1 }}>{uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              aria-label="Dismiss"
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Document list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
        {documents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 16px',
              color: 'var(--text-muted)',
              fontSize: 12.5,
              lineHeight: 1.6,
            }}
          >
            <FileText size={28} style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }} />
            No documents yet.
            <br />
            Upload PDFs, TXT, DOCX, MD.
          </div>
        ) : (
          <AnimatePresence>
            {documents.map((doc) => {
              const isProcessing = ['queued', 'parsing', 'embedding', 'indexing'].includes(doc.status)
              return (
                <motion.div
                  key={doc.doc_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    marginBottom: 4,
                    background: selectedDocuments[doc.doc_id] ? 'rgba(168,199,250,0.08)' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedDocuments[doc.doc_id] ? 'rgba(168,199,250,0.2)' : 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Selection Checkbox */}
                  <div
                    onClick={() => toggleDocumentSelection(doc.doc_id)}
                    style={{
                      flexShrink: 0,
                      marginTop: 3,
                      cursor: 'pointer',
                      color: selectedDocuments[doc.doc_id] ? 'var(--accent-blue)' : 'var(--text-muted)',
                    }}
                  >
                    {selectedDocuments[doc.doc_id] ? <CheckSquare size={16} /> : <Square size={16} />}
                  </div>

                  {/* Number badge */}
                  <div
                    style={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: doc.status === 'done' ? 'var(--accent-blue)' : 'var(--bg-hover)',
                      color: doc.status === 'done' ? '#131314' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      marginTop: 1,
                    }}
                  >
                    {doc.number}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}
                    >
                      {doc.filename}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      {isProcessing ? (
                        <Loader2
                          size={10}
                          style={{
                            color: STATUS_COLOR[doc.status],
                            animation: 'spin 1s linear infinite',
                          }}
                        />
                      ) : doc.status === 'done' ? (
                        <CheckCircle size={10} style={{ color: STATUS_COLOR.done }} />
                      ) : (
                        <AlertCircle size={10} style={{ color: STATUS_COLOR.error }} />
                      )}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          handleView(doc)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: 3,
                          borderRadius: 4,
                          display: 'flex',
                        }}
                        title="View document"
                      >
                        {loadingView === doc.doc_id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Eye size={12} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(doc)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 3,
                        borderRadius: 4,
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
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
            onClick={() => setViewer(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 16,
                border: '1px solid var(--border)',
                width: '100%',
                maxWidth: 760,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
              }}
            >
              {/* Viewer header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--bg-panel)',
                }}
              >
                <span
                  style={{
                    background: 'var(--accent-blue)',
                    color: '#131314',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Doc {viewer.doc.number}
                </span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {viewer.doc.filename}
                </span>
                <button
                  onClick={() => setViewer(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    padding: 4,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              {/* Content */}
              <pre
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '20px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 12.5,
                  lineHeight: 1.7,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {viewer.content}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
