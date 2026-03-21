'use client';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Paperclip, Square, Globe, GraduationCap, Code2, Newspaper, Image as ImageIcon, X, ChevronDown } from 'lucide-react';
import { useSearchStore } from '@/store/useSearchStore';
import { FocusMode, ModelOption, FOCUS_LABELS, MODEL_LABELS } from '@/lib/types';
import { fileToBase64, cn } from '@/lib/utils';

const FOCUS_ICONS: Record<FocusMode, React.ReactNode> = {
  all:      <Globe size={13} />,
  academic: <GraduationCap size={13} />,
  code:     <Code2 size={13} />,
  news:     <Newspaper size={13} />,
  images:   <ImageIcon size={13} />,
};

interface Props {
  onSearch: (query: string, image?: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export function SearchBar({ onSearch, placeholder, compact }: Props) {
  const [query, setQuery] = useState('');
  const [image, setImage] = useState<{ base64: string; preview: string; name: string } | null>(null);
  const [showFocus, setShowFocus] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { model, focus, isStreaming, setModel, setFocus, cancelStream } = useSearchStore();

  const handleSubmit = useCallback(() => {
    const q = query.trim();
    if (!q || isStreaming) return;
    onSearch(q, image?.base64);
    setQuery('');
    setImage(null);
  }, [query, image, isStreaming, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const preview = URL.createObjectURL(file);
    setImage({ base64, preview, name: file.name });
  };

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Image preview */}
      <AnimatePresence>
        {image && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--bg-secondary)',
              borderRadius: 10,
              padding: '8px 12px',
              border: '1px solid var(--border)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.preview} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', flex: 1 }}>{image.name}</span>
            <button
              onClick={() => setImage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input box */}
      <div
        style={{
          background: 'var(--bg-input)',
          border: '1.5px solid var(--border)',
          borderRadius: compact ? 14 : 18,
          overflow: 'hidden',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={() => {}}
      >
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Ask anything about your documents…'}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: compact ? 14 : 15.5,
            color: 'var(--text-primary)',
            padding: compact ? '12px 16px' : '16px 18px 8px',
            lineHeight: 1.6,
            minHeight: compact ? 44 : 52,
          }}
        />

        {/* Bottom toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: compact ? '4px 10px 8px' : '6px 12px 12px',
            gap: 6,
          }}
        >
          {/* Attach image */}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-ghost"
            style={{ padding: '5px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}
            title="Upload image"
          >
            <Paperclip size={13} />
          </button>

          {/* Focus mode */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowFocus(!showFocus); setShowModel(false); }}
              className="btn-ghost"
              style={{ padding: '5px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {FOCUS_ICONS[focus]}
              <span style={{ fontSize: 12 }}>{FOCUS_LABELS[focus].label}</span>
              <ChevronDown size={11} />
            </button>
            <AnimatePresence>
              {showFocus && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{
                    position: 'absolute',
                    bottom: '110%',
                    left: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                    minWidth: 160,
                    zIndex: 50,
                  }}
                >
                  {(Object.keys(FOCUS_LABELS) as FocusMode[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFocus(f); setShowFocus(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '9px 14px',
                        background: f === focus ? 'var(--bg-hover)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        textAlign: 'left',
                      }}
                    >
                      {FOCUS_ICONS[f]}
                      {FOCUS_LABELS[f].label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Model selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowModel(!showModel); setShowFocus(false); }}
              className="btn-ghost"
              style={{ padding: '5px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <span style={{ fontSize: 12 }}>{MODEL_LABELS[model]}</span>
              <ChevronDown size={11} />
            </button>
            <AnimatePresence>
              {showModel && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{
                    position: 'absolute',
                    bottom: '110%',
                    left: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                    minWidth: 170,
                    zIndex: 50,
                  }}
                >
                  {(Object.keys(MODEL_LABELS) as ModelOption[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setModel(m); setShowModel(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '9px 14px',
                        background: m === model ? 'var(--bg-hover)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        textAlign: 'left',
                      }}
                    >
                      {MODEL_LABELS[m]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Submit / Stop */}
          <motion.button
            onClick={isStreaming ? cancelStream : handleSubmit}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: query.trim() || isStreaming ? 'var(--accent-blue)' : 'var(--bg-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: query.trim() || isStreaming ? 'white' : 'var(--text-muted)',
              transition: 'background 0.2s',
            }}
          >
            {isStreaming ? <Square size={14} fill="currentColor" /> : <ArrowUp size={16} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}