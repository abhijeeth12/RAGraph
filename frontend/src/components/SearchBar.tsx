'use client';
import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Square } from 'lucide-react';
import { useSearchStore } from '@/store/useSearchStore';

interface Props {
  onSearch: (query: string, image?: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export function SearchBar({ onSearch, placeholder, compact }: Props) {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isStreaming, cancelStream } = useSearchStore();

  const handleSubmit = useCallback(() => {
    const q = query.trim();
    if (!q || isStreaming) return;
    onSearch(q);
    setQuery('');
  }, [query, isStreaming, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Main input box */}
      <div
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          borderRadius: compact ? 8 : 12,
          display: 'flex',
          alignItems: 'center',
          padding: compact ? '8px 10px' : '10px 12px',
          gap: 8,
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Ask anything about your documents…'}
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 14.5,
            lineHeight: 1.4,
            color: 'var(--text-primary)',
            padding: '6px 4px',
            minHeight: 24,
            maxHeight: 200,
          }}
        />

        {/* Submit / Stop */}
        <motion.button
          onClick={isStreaming ? cancelStream : handleSubmit}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            flexShrink: 0,
            background: query.trim() || isStreaming ? 'var(--text-primary)' : 'var(--bg-secondary)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: query.trim() || isStreaming ? 'var(--bg-primary)' : 'var(--text-muted)',
            transition: 'background 0.2s',
          }}
        >
          {isStreaming ? <Square size={14} fill="currentColor" /> : <ArrowUp size={16} />}
        </motion.button>
      </div>
    </div>
  );
}