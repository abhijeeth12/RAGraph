'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2, CheckCircle, AlertCircle, FileText, PanelRightClose, PanelRightOpen, Trash2 } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { uploadDocument, pollIngestionStatus, listDocuments, deleteDocument } from '@/lib/api'

export function SourcesPanel() {
  const store = useSearchStore()
  const { documents, setDocuments, isUploading: uploading, setUploading, uploadPct, setUploadPct } = store
  const fileRef = useRef<HTMLInputElement>(null)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await listDocuments()
      setDocuments(data.documents)
      // Remove deleted documents from selection
      setSelectedIds(prev => {
        const next = new Set(prev)
        const docIds = new Set(data.documents.map((d: any) => d.doc_id))
        for (const id of next) {
          if (!docIds.has(id)) next.delete(id)
        }
        return next
      })
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

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length && documents.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(documents.map(d => d.doc_id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} document(s)?`)) return
    
    setIsDeleting(true)
    try {
      for (const id of Array.from(selectedIds)) {
        await deleteDocument(id)
      }
      setSelectedIds(new Set())
      await refresh()
    } catch (err) {
      console.error("Failed to delete documents:", err)
      alert("Some documents failed to delete.")
    } finally {
      setIsDeleting(false)
    }
  }

  const isAllSelected = documents.length > 0 && selectedIds.size === documents.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < documents.length

  if (!isOpen) {
    return (
      <div className="panel-container" style={{ width: 64, height: '100%', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button className="btn-ghost" style={{ padding: 6, border: 'none' }} onClick={() => setIsOpen(true)} title="Expand Sources">
          <PanelRightOpen size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="panel-container" style={{ width: 340, height: '100%', padding: '20px 0', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          Sources
        </h2>
        <button className="btn-ghost" style={{ padding: 6, border: 'none' }} onClick={() => setIsOpen(false)} title="Collapse Sources">
          <PanelRightClose size={18} />
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
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', background: 'var(--bg-app)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: 24, cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 500, transition: 'background 0.2s', opacity: uploading ? 0.7 : 1,
          }}
          onMouseOver={(e) => { if(!uploading) e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-app)' }}
        >
          {uploading
            ? <><Loader2 size={16} className="animate-spin" /> Processing {uploadPct}%…</>
            : <><Plus size={16} /> Add new source</>
          }
        </button>
      </div>

      {/* Selection Toolbar */}
      <div style={{
        padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 24, marginBottom: 8, height: 32
      }}>
        {documents.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
            <input 
              type="checkbox"
              checked={isAllSelected}
              ref={input => { if (input) input.indeterminate = isSomeSelected }}
              onChange={toggleSelectAll}
              style={{
                width: 16, height: 16, cursor: 'pointer',
                accentColor: 'var(--accent-blue)'
              }}
            />
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
          </label>
        )}
        
        {selectedIds.size > 0 && (
          <button 
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            style={{ 
              background: 'none', border: 'none', color: '#ef4444', 
              display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 4 
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
            {documents.map((doc, idx) => (
              <motion.div
                key={doc.doc_id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px', borderRadius: 8,
                  cursor: 'pointer',
                  background: selectedIds.has(doc.doc_id) ? 'var(--bg-active)' : 'transparent',
                  marginBottom: 2,
                  transition: 'background 0.15s'
                }}
                onClick={() => toggleSelect(doc.doc_id)}
                onMouseOver={(e) => { if (!selectedIds.has(doc.doc_id)) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseOut={(e) => { if (!selectedIds.has(doc.doc_id)) e.currentTarget.style.background = 'transparent' }}
              >
                
                <input 
                  type="checkbox"
                  checked={selectedIds.has(doc.doc_id)}
                  onChange={() => {}} // handled by parent div click
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
                  onClick={(e) => { e.stopPropagation(); toggleSelect(doc.doc_id); }} // Prevent double trigger, but handle toggle
                />

                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {doc.status === 'done' ? (
                     <FileText size={12} color="var(--accent-blue)" />
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
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {doc.status === 'done' ? `${doc.node_count} chunks` : doc.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

    </div>
  )
}
