import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Loader2,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { uploadDocument, pollIngestionStatus, listDocuments, deleteDocument, cancelDocument } from '@/lib/api'

export function SourcesPanel() {
  const store = useSearchStore()
  const { documents, setDocuments, isUploading: uploading, setUploading, uploadPct, setUploadPct, activeNotebookId } = store
  const fileRef = useRef<HTMLInputElement>(null)

  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [processingLabel, setProcessingLabel] = useState<string | null>(null)
  const uploadAbortRef = useRef<AbortController | null>(null)
  const currentUploadingDocIdRef = useRef<string | null>(null)
  const isCancelledRef = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const data = await listDocuments(activeNotebookId)
      if (data?.documents) {
        setDocuments(data.documents)
      }
    } catch {
      // offline fallback
    }
  }, [activeNotebookId, setDocuments])

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

  const handleDeleteOne = async (id: string) => {
    if (currentUploadingDocIdRef.current === id) {
      isCancelledRef.current = true
      if (uploadAbortRef.current) {
        try { uploadAbortRef.current.abort() } catch { /* ignore */ }
        uploadAbortRef.current = null
      }
      setUploading(false)
      setUploadPct(0)
      setProcessingLabel(null)
    }
    try {
      await deleteDocument(id)
      await refresh()
    } catch (err) {
      console.error('Failed to delete document:', err)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''
    setUploading(true)
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
          console.log('Upload cancelled')
          break
        }
        console.error('Upload failed:', err)
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

  const toggleSelectAll = () => {
    const isAllSelected = documents.length > 0 && documents.every((d) => store.selectedDocuments[d.doc_id])
    store.selectAllDocuments(
      documents.map((d) => d.doc_id),
      !isAllSelected
    )
  }

  const toggleSelect = (id: string) => {
    store.toggleDocumentSelection(id)
  }

  const handleDeleteSelected = async () => {
    const selectedIds = Object.entries(store.selectedDocuments)
      .filter(([_, v]) => v)
      .map(([id]) => id)
    if (selectedIds.length === 0) return
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} document(s)?`)) return

    setIsDeleting(true)
    try {
      for (const id of selectedIds) {
        await deleteDocument(id)
      }
      store.clearDocumentSelection()
      await refresh()
    } catch (err) {
      console.error('Failed to delete documents:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const selectedCount = Object.values(store.selectedDocuments).filter(Boolean).length
  const isAllSelected = documents.length > 0 && selectedCount === documents.length
  const isSomeSelected = selectedCount > 0 && selectedCount < documents.length

  return (
    <motion.div
      className="glass-sidebar sources-panel-container"
      initial={false}
      animate={{ width: isOpen ? 290 : 56 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        height: '100%',
        padding: '14px 0',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOpen ? 'space-between' : 'center',
          padding: isOpen ? '0 16px' : '0',
          marginBottom: 16,
        }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.h2
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              style={{
                fontSize: 20,
                fontWeight: 400,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >
              Sources
            </motion.h2>
          )}
        </AnimatePresence>
        <button
          className="btn-ghost"
          style={{ padding: 6, border: 'none' }}
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Collapse Sources' : 'Expand Sources'}
        >
          {isOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%', boxSizing: 'border-box' }}
          >
            {/* Add Sources Area */}
            <div style={{ padding: '0 16px', boxSizing: 'border-box' }}>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.docx,.pptx,.json"
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
                  background: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 24,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'background 0.2s',
                  opacity: uploading ? 0.7 : 1,
                }}
                onMouseOver={(e) => {
                  if (!uploading) e.currentTarget.style.background = 'var(--bg-hover)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'var(--bg-app)'
                }}
              >
                {uploading ? (
                  processingLabel ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> {processingLabel}
                    </>
                  ) : (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Uploading {uploadPct}%…
                    </>
                  )
                ) : (
                  <>
                    <Plus size={16} /> Add new source
                  </>
                )}
              </button>

              {uploading && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCancelActiveUpload()
                    }}
                    style={{
                      width: '100%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#ef4444',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 16,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Cancel upload or processing"
                  >
                    <X size={13} />
                    <span>Cancel current operation</span>
                  </button>
                </div>
              )}
            </div>

            {/* Selection Toolbar */}
            <div
              style={{
                padding: '0 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 24,
                marginBottom: 8,
                height: 32,
              }}
            >
              {documents.length > 0 && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isSomeSelected
                    }}
                    onChange={toggleSelectAll}
                    style={{
                      width: 16,
                      height: 16,
                      cursor: 'pointer',
                      accentColor: 'var(--accent-blue)',
                    }}
                  />
                  {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
                </label>
              )}

              {selectedCount > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  title="Delete Selected"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              )}
            </div>

            {/* Document List */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0 12px' }}>
              {documents.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)' }}>
                  <FileText size={24} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: 13 }}>Uploaded sources will appear here</p>
                </div>
              ) : (
                <AnimatePresence>
                  {documents.map((doc) => (
                    <motion.div
                      key={doc.doc_id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '8px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: store.selectedDocuments[doc.doc_id]
                          ? 'var(--bg-active)'
                          : 'transparent',
                        marginBottom: 2,
                        transition: 'background 0.15s',
                      }}
                      onClick={() => toggleSelect(doc.doc_id)}
                      onMouseOver={(e) => {
                        if (!store.selectedDocuments[doc.doc_id])
                          e.currentTarget.style.background = 'var(--bg-hover)'
                      }}
                      onMouseOut={(e) => {
                        if (!store.selectedDocuments[doc.doc_id])
                          e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={store.selectedDocuments[doc.doc_id] || false}
                        onChange={() => {}}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: 'pointer',
                          accentColor: 'var(--accent-blue)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelect(doc.doc_id)
                        }}
                      />

                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: 'var(--bg-app)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {doc.status === 'done' ? (
                          <FileText size={12} color="var(--accent-blue)" />
                        ) : doc.status === 'error' ? (
                          <AlertCircle size={12} color="#ef4444" />
                        ) : (
                          <Loader2 size={12} className="animate-spin" color="var(--accent-amber)" />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {doc.filename}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {doc.status === 'done' ? `${doc.node_count} chunks` : doc.status}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteOne(doc.doc_id)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 6,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444'
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-muted)'
                          e.currentTarget.style.background = 'none'
                        }}
                        title="Delete or cancel document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
