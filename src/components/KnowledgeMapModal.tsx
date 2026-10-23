import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize, Minimize, Sparkles, LayoutGrid, RotateCcw, FileText } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { getKnowledgeMap, generateKnowledgeMap } from '@/lib/api'
import { KnowledgeMindMap } from './KnowledgeMap/MindMap'

interface KnowledgeMapModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function KnowledgeMapModal({ isOpen, onClose }: KnowledgeMapModalProps) {
  const store = useSearchStore()
  const { selectedDocuments, activeNotebookId, notebooks, ensureActiveNotebookId } = store

  const [outline, setOutline] = useState<any>(null)
  const [documentStructure, setDocumentStructure] = useState<any>(null)
  const [mode, setMode] = useState<'mindmap' | 'structure'>('mindmap')

  const [phase, setPhase] = useState<'loading' | 'idle'>('loading')
  const [generating, setGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [staleDocs, setStaleDocs] = useState<string[]>([])
  const [docCount, setDocCount] = useState(0)
  const busyRef = useRef(false)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId)

  const selectedDocIdsString = Object.entries(selectedDocuments)
    .filter(([_, isSelected]) => isSelected)
    .map(([id]) => id)
    .sort()
    .join(',')

  const applyMap = useCallback((data: any) => {
    setOutline(data.outline || null)
    setDocumentStructure(data.document_structure || null)
    setStaleDocs(data.stale ? data.new_docs || [] : [])
    setDocCount(data.doc_count || 0)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    // Immediately isolate state: clear prior notebook's data to prevent cross-leakage
    setOutline(null)
    setDocumentStructure(null)
    setErrorMsg(null)
    setStaleDocs([])
    setDocCount(0)
    setGenerating(false)

    const clearPoll = () => {
      if (pollTimer.current) {
        clearTimeout(pollTimer.current)
        pollTimer.current = null
      }
    }

    if (!activeNotebookId) {
      setPhase('idle')
      return () => {
        isMounted = false
        clearPoll()
      }
    }

    const currentNbId = activeNotebookId
    const selectedDocIds = selectedDocIdsString ? selectedDocIdsString.split(',') : []

    async function pollStatus(nbId: string): Promise<void> {
      try {
        const data = await getKnowledgeMap(nbId, selectedDocIds.length > 0 ? selectedDocIds : undefined)
        if (!isMounted || store.activeNotebookId !== nbId) return
        if (data.generating || data.status === 'generating') {
          setGenerating(true)
          pollTimer.current = setTimeout(() => {
            if (isMounted) void pollStatus(nbId)
          }, 3000)
          return
        }
        setGenerating(false)
        if (data.document_structure) {
          setDocumentStructure(data.document_structure)
        }
        if (data.exists && (data.outline as any)?.children?.length) {
          applyMap(data)
          if (data.status === 'failed' || (data as any).error) {
            setErrorMsg((data as any).error || 'Map regeneration failed. Your existing map was kept.')
          } else {
            setErrorMsg(null)
          }
        } else if (data.document_structure) {
          applyMap(data)
        } else if (data.status === 'failed' || (data as any).error) {
          setErrorMsg((data as any).error || 'Map generation failed. Please try again.')
        }
      } catch (e: any) {
        if (!isMounted || store.activeNotebookId !== nbId) return
        setGenerating(false)
        setErrorMsg(e?.message || 'Failed to check map status')
      }
    }

    async function loadStatus() {
      setPhase('loading')
      setErrorMsg(null)
      try {
        let targetNbId = currentNbId
        try {
          const persistedId = await ensureActiveNotebookId()
          if (persistedId) targetNbId = persistedId
        } catch (err) {
          console.warn('Could not ensure notebook persistence:', err)
        }

        const data = await getKnowledgeMap(targetNbId, selectedDocIds.length > 0 ? selectedDocIds : undefined)
        if (!isMounted || store.activeNotebookId !== currentNbId) return
        setDocCount(data.doc_count || 0)
        if (data.document_structure) {
          setDocumentStructure(data.document_structure)
        }
        if (data.generating || data.status === 'generating') {
          setGenerating(true)
          pollTimer.current = setTimeout(() => {
            if (isMounted) void pollStatus(targetNbId)
          }, 3000)
        } else if (data.exists && (data.outline as any)?.children?.length) {
          applyMap(data)
          if (data.status === 'failed' || (data as any).error) {
            setErrorMsg((data as any).error || 'Map regeneration failed. Your existing map was kept.')
          }
        } else if (data.document_structure) {
          applyMap(data)
        } else if (data.status === 'failed' || (data as any).error) {
          setErrorMsg((data as any).error || 'Map generation failed. Please try again.')
        }
      } catch (e: any) {
        if (!isMounted) return
        setErrorMsg(e?.message || 'Failed to load knowledge map')
      } finally {
        if (isMounted) setPhase('idle')
      }
    }

    void loadStatus()

    return () => {
      isMounted = false
      clearPoll()
    }
  }, [isOpen, activeNotebookId, selectedDocIdsString, applyMap, ensureActiveNotebookId, store.activeNotebookId])

  async function handleGenerate() {
    if (busyRef.current || generating || !activeNotebookId) return
    busyRef.current = true
    setErrorMsg(null)
    setGenerating(true)
    const currentNbId = activeNotebookId
    try {
      let targetNbId = currentNbId
      try {
        const persistedId = await ensureActiveNotebookId()
        if (persistedId) targetNbId = persistedId
      } catch (err) {
        console.warn('Could not ensure notebook persistence:', err)
      }

      const selectedDocIds = selectedDocIdsString ? selectedDocIdsString.split(',') : []
      await generateKnowledgeMap(targetNbId, selectedDocIds.length > 0 ? selectedDocIds : undefined)

      const poll = async (): Promise<void> => {
        try {
          const data = await getKnowledgeMap(targetNbId, selectedDocIds.length > 0 ? selectedDocIds : undefined)
          if (store.activeNotebookId !== currentNbId) return
          if (data.generating || data.status === 'generating') {
            pollTimer.current = setTimeout(() => void poll(), 3000)
            return
          }
          setGenerating(false)
          if (data.document_structure) {
            setDocumentStructure(data.document_structure)
          }
          if (data.exists && (data.outline as any)?.children?.length) {
            applyMap(data)
            if (data.status === 'failed' || (data as any).error) {
              setErrorMsg((data as any).error || 'Map generation failed. Your previous map was kept.')
            } else {
              setErrorMsg(null)
            }
          } else if (data.document_structure) {
            applyMap(data)
          } else {
            setErrorMsg((data as any)?.error || 'Map generation failed. Please try again.')
          }
        } catch (e: any) {
          setGenerating(false)
          setErrorMsg(e?.message || 'Map generation failed. Your previous map was kept.')
        }
      }
      pollTimer.current = setTimeout(() => void poll(), 3000)
    } catch (e: any) {
      const msg = e?.message || ''
      if (/already in progress|409/.test(msg)) {
        const selectedDocIds = selectedDocIdsString ? selectedDocIdsString.split(',') : []
        const poll = async (): Promise<void> => {
          try {
            const data = await getKnowledgeMap(currentNbId, selectedDocIds.length > 0 ? selectedDocIds : undefined)
            if (store.activeNotebookId !== currentNbId) return
            if (data.generating || data.status === 'generating') {
              pollTimer.current = setTimeout(() => void poll(), 3000)
              return
            }
            setGenerating(false)
            if (data.document_structure) {
              setDocumentStructure(data.document_structure)
            }
            if (data.exists && (data.outline as any)?.children?.length) {
              applyMap(data)
              setErrorMsg(null)
            }
          } catch {
            setGenerating(false)
          }
        }
        pollTimer.current = setTimeout(() => void poll(), 3000)
      } else {
        setGenerating(false)
        setErrorMsg(msg || 'Failed to start map generation')
      }
    } finally {
      busyRef.current = false
    }
  }

  if (!isOpen) return null

  const activeData = mode === 'mindmap' ? outline : documentStructure

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isFullscreen ? 0 : '4vh 4vw',
        }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          style={{
            background: 'var(--bg-app, #0e1117)',
            borderRadius: isFullscreen ? 0 : 20,
            border: isFullscreen ? 'none' : '1px solid var(--border, rgba(255,255,255,0.1))',
            width: '100%',
            height: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(25, 30, 40, 0.85)',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  fontFamily: 'var(--font-display, inherit)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text-primary, #f8fafc)',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: mode === 'mindmap' ? 'var(--accent-blue, #60a5fa)' : '#ffdf99',
                    boxShadow: mode === 'mindmap' ? '0 0 10px #60a5fa' : '0 0 10px #ffdf99',
                  }}
                />
                {mode === 'mindmap' ? 'Knowledge Map' : 'Document Structure'}{' '}
                {activeNotebook ? `• ${activeNotebook.title}` : ''}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', marginTop: 4 }}>
                {mode === 'mindmap'
                  ? 'Conceptual Knowledge Map • Relational synthesis across documents'
                  : 'Document Structure • Original extracted headings, sections & paragraphs'}{' '}
                • {activeNotebook ? `Notebook: ${activeNotebook.title}` : 'Visualizing document concepts'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {mode === 'mindmap' && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-ghost"
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: '1px solid var(--border, rgba(255,255,255,0.15))',
                    borderRadius: 20,
                    opacity: generating ? 0.6 : 1,
                    cursor: generating ? 'default' : 'pointer',
                    color: 'var(--text-primary, #f8fafc)',
                  }}
                  title={
                    staleDocs.length
                      ? `Includes ${staleDocs.length} new document(s)`
                      : 'Regenerate map from current notebook documents'
                  }
                >
                  <Sparkles size={14} /> {generating ? 'Generating…' : outline ? 'Regenerate' : 'Generate'}
                </button>
              )}

              {/* Mode Switcher Button: Knowledge Map <-> Document Structure */}
              <button
                onClick={() => setMode((m) => (m === 'mindmap' ? 'structure' : 'mindmap'))}
                className="btn-ghost"
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid var(--border, rgba(255,255,255,0.15))',
                  borderRadius: 20,
                  background: mode === 'structure' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255,255,255,0.04)',
                  color: mode === 'structure' ? 'var(--accent-blue, #60a5fa)' : 'var(--text-primary, #f8fafc)',
                  cursor: 'pointer',
                }}
                title={
                  mode === 'mindmap'
                    ? 'Switch to Document Structure (original extracted document hierarchy)'
                    : 'Switch to Knowledge Map (conceptual relationships)'
                }
              >
                <LayoutGrid size={14} /> {mode === 'mindmap' ? 'Document Structure' : 'Knowledge Map'}
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="btn-ghost"
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid var(--border, rgba(255,255,255,0.15))',
                  background: 'none',
                  color: 'var(--text-primary, #f8fafc)',
                  cursor: 'pointer',
                }}
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
              <button
                onClick={onClose}
                className="btn-ghost"
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid var(--border, rgba(255,255,255,0.15))',
                  background: 'none',
                  color: 'var(--text-primary, #f8fafc)',
                  cursor: 'pointer',
                }}
                title="Close View"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Canvas Container */}
          <div
            ref={containerRef}
            style={{
              flex: 1,
              position: 'relative',
              background: '#0a0d12',
              overflow: 'hidden',
            }}
          >
            {phase === 'loading' ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <p style={{ fontSize: 14, color: 'var(--text-muted, #94a3b8)' }}>Loading view…</p>
              </div>
            ) : generating && !outline && mode === 'mindmap' ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 12,
                  padding: 24,
                }}
              >
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                  Generating Knowledge Map…
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted, #94a3b8)',
                    maxWidth: 440,
                    textAlign: 'center',
                    lineHeight: 1.6,
                  }}
                >
                  Synthesizing conceptual topology across documents in{' '}
                  {activeNotebook ? `"${activeNotebook.title}"` : 'this notebook'}. You can explore Document Structure
                  in the meantime.
                </p>
                {documentStructure && (
                  <button
                    onClick={() => setMode('structure')}
                    style={{
                      marginTop: 8,
                      padding: '8px 20px',
                      fontSize: 13,
                      fontWeight: 500,
                      borderRadius: 20,
                      background: 'rgba(96, 165, 250, 0.15)',
                      color: 'var(--accent-blue, #60a5fa)',
                      border: '1px solid var(--accent-blue, #60a5fa)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <FileText size={14} /> View Document Structure Now
                  </button>
                )}
              </div>
            ) : mode === 'mindmap' && !outline ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 14,
                  padding: 24,
                }}
              >
                {!activeNotebookId ? (
                  <>
                    <p style={{ fontSize: 15, color: 'var(--text-primary, #f8fafc)' }}>No active notebook selected</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', maxWidth: 420, textAlign: 'center', lineHeight: 1.6 }}>
                      Please select a notebook to view its knowledge map or document structure.
                    </p>
                  </>
                ) : docCount === 0 ? (
                  <>
                    <p style={{ fontSize: 15, color: 'var(--text-primary, #f8fafc)' }}>
                      No documents in {activeNotebook ? `"${activeNotebook.title}"` : 'this notebook'} yet
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', maxWidth: 420, textAlign: 'center', lineHeight: 1.6 }}>
                      Upload documents to this notebook first to extract their document structure and generate a knowledge map.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                      No Knowledge Map Generated Yet
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', maxWidth: 440, textAlign: 'center', lineHeight: 1.6 }}>
                      Generate a cohesive conceptual knowledge map from all {docCount} document{docCount === 1 ? '' : 's'} in{' '}
                      {activeNotebook ? `"${activeNotebook.title}"` : 'this notebook'}.
                    </p>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        style={{
                          padding: '10px 24px',
                          fontSize: 14,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'var(--accent-blue, #3b82f6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 24,
                          cursor: generating ? 'default' : 'pointer',
                          opacity: generating ? 0.6 : 1,
                        }}
                      >
                        <Sparkles size={15} /> + Generate Knowledge Map
                      </button>
                      {documentStructure && (
                        <button
                          onClick={() => setMode('structure')}
                          style={{
                            padding: '10px 20px',
                            fontSize: 14,
                            fontWeight: 500,
                            borderRadius: 24,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid var(--border, rgba(255,255,255,0.15))',
                            color: 'var(--text-primary, #f8fafc)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <FileText size={15} /> View Document Structure
                        </button>
                      )}
                    </div>
                  </>
                )}
                {errorMsg && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <p style={{ fontSize: 13, color: '#f2b8b5', maxWidth: 460, textAlign: 'center', lineHeight: 1.6 }}>
                      {errorMsg}
                    </p>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      style={{
                        padding: '8px 20px',
                        fontSize: 13,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(242, 184, 181, 0.15)',
                        color: '#f2b8b5',
                        border: '1px solid #f2b8b5',
                        borderRadius: 20,
                        cursor: generating ? 'default' : 'pointer',
                        opacity: generating ? 0.6 : 1,
                      }}
                    >
                      <RotateCcw size={14} /> Retry Generation
                    </button>
                  </div>
                )}
              </div>
            ) : mode === 'structure' && !documentStructure ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 14,
                  padding: 24,
                }}
              >
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                  No Extracted Document Structure Available
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', maxWidth: 440, textAlign: 'center', lineHeight: 1.6 }}>
                  Upload documents to this notebook to view their original headings, sections, and paragraphs.
                </p>
              </div>
            ) : (
              <>
                {staleDocs.length > 0 && mode === 'mindmap' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 15,
                      background: 'rgba(20,24,32,0.92)',
                      border: '1px solid var(--border, rgba(255,255,255,0.15))',
                      borderRadius: 20,
                      padding: '6px 16px',
                      fontSize: 12,
                      color: 'var(--text-muted, #94a3b8)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                    }}
                  >
                    <span>
                      {staleDocs.length} new document{staleDocs.length === 1 ? '' : 's'} not in this map
                    </span>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-blue, #60a5fa)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Regenerate to include
                    </button>
                  </div>
                )}

                {/* Shared High-Performance Canvas */}
                <KnowledgeMindMap
                  data={activeData}
                  mode={mode}
                  notebookTitle={activeNotebook?.title}
                  onSelect={(node) => {
                    console.log('Selected node:', node)
                  }}
                />
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
