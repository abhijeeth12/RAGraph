'use client';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { label: 'Searching knowledge base', icon: '🔍' },
  { label: 'Retrieving relevant chunks', icon: '📄' },
  { label: 'Ranking by relevance', icon: '⚖️' },
  { label: 'Generating answer', icon: '✨' },
];

interface Props {
  visible: boolean;
  step?: number; // 0-3
}

export function ThinkingIndicator({ visible, step = 0 }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          {/* Animated dots header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--accent-blue)',
                  }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Thinking…
            </span>
          </div>

          {/* Step indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: i <= step ? 1 : 0.3, x: 0 }}
                transition={{ delay: i * 0.15 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: 12.5,
                  color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <span style={{ fontSize: 13 }}>{s.icon}</span>
                <span>{s.label}</span>
                {i === step && (
                  <motion.div
                    style={{
                      width: 60,
                      height: 3,
                      borderRadius: 99,
                      background: 'var(--bg-secondary)',
                      overflow: 'hidden',
                      marginLeft: 4,
                    }}
                  >
                    <motion.div
                      style={{ height: '100%', background: 'var(--accent-blue)', borderRadius: 99 }}
                      animate={{ width: ['0%', '100%'] }}
                      transition={{ duration: 1.5, ease: 'linear' }}
                    />
                  </motion.div>
                )}
                {i < step && (
                  <span style={{ color: 'var(--accent-green)', fontSize: 11, marginLeft: 4 }}>✓</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}