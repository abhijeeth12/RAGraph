'use client'
import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, Square, Paperclip } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'

interface Props {
  onSearch: (query: string, image?: string) => void
  placeholder?: string
  onAttachClick?: () => void
}

export function SearchBar({ onSearch, placeholder, onAttachClick }: Props) {
  const [query, setQuery] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { isStreaming, cancelStream, documents } = useSearchStore()

  const handleSubmit = useCallback(() => {
    const q = query.trim()
    if (!q || isStreaming) return
    onSearch(q)
    setQuery('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [query, isStreaming, onSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const autoResize = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }

  return (
    <div
      style={{
        background: 'var(--bg-app)',
        border: '1px solid var(--border)',
        borderRadius: 32,
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        gap: 12,
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: 800,
        margin: '0 auto',
        position: 'relative',
        backdropFilter: 'blur(20px)',
      }}
    >
      <textarea
        ref={textareaRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          autoResize()
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Ask a question across your documents or discover something new...'}
        rows={1}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          color: 'var(--text-primary)',
          maxHeight: 200,
          minHeight: 24,
          paddingTop: 2,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        {/* Source count indicator */}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', userSelect: 'none' }}>
          {documents.length} source{documents.length !== 1 ? 's' : ''}
        </span>

        {/* Attachment button */}
        <button
          onClick={onAttachClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent-blue)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
          }}
          title="Upload or manage documents"
        >
          <Paperclip size={18} />
        </button>

        {/* Submit button */}
        <motion.button
          onClick={isStreaming ? cancelStream : handleSubmit}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: query.trim() || isStreaming ? 'var(--text-primary)' : 'var(--bg-hover)',
            color: query.trim() || isStreaming ? 'var(--bg-app)' : 'var(--text-muted)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: query.trim() || isStreaming ? 'pointer' : 'default',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {isStreaming ? (
            <Square size={13} fill="currentColor" />
          ) : (
            <ArrowUp size={16} strokeWidth={2.5} />
          )}
        </motion.button>
      </div>
    </div>
  )
}