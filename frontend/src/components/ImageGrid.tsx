'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RetrievedImage } from '@/lib/types'
import { resolveImageUrl } from '@/lib/api'
import { X, ZoomIn } from 'lucide-react'

interface Props {
  images: RetrievedImage[]
}

export function ImageGrid({ images }: Props) {
  const [lightbox, setLightbox] = useState<RetrievedImage | null>(null)

  if (!images.length) return null

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <p className="section-label" style={{ marginBottom: 10 }}>
          Related images ({images.length})
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 10,
        }}>
          {images.map((img, i) => {
            const src = resolveImageUrl(img.url)
            return (
              <motion.div
                key={`image-grid-item-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setLightbox(img)}
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  borderRadius: 10,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}
                whileHover={{ scale: 1.02 }}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={img.alt ?? img.caption ?? ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => {
                      const el = e.target as HTMLImageElement
                      el.style.display = 'none'
                      const parent = el.parentElement
                      if (parent) {
                        parent.style.background = 'var(--bg-hover)'
                        parent.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--text-muted)">Image unavailable</div>'
                      }
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: 'var(--text-muted)',
                  }}>
                    No image
                  </div>
                )}

                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }} className="img-overlay">
                  <ZoomIn size={20} style={{ color: 'white', opacity: 0 }} className="zoom-icon" />
                </div>

                {/* Caption */}
                {img.caption && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '16px 8px 6px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    fontSize: 10.5, color: 'rgba(255,255,255,0.9)', lineHeight: 1.3,
                  }}>
                    {img.caption.slice(0, 60)}{img.caption.length > 60 ? '…' : ''}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.88)',
              zIndex: 1000, display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)', borderRadius: 16,
                overflow: 'hidden', maxWidth: 800, width: '100%',
                boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(lightbox.url)}
                alt={lightbox.alt ?? ''}
                style={{ width: '100%', display: 'block', maxHeight: 500, objectFit: 'contain' }}
              />
              <div style={{ padding: '14px 18px' }}>
                {lightbox.caption && (
                  <p style={{ fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {lightbox.caption}
                  </p>
                )}
                {lightbox.heading_path?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {lightbox.heading_path.map((h, i) => (
                      <span key={`lightbox-path-${i}`} style={{
                        fontSize: 11, background: 'var(--bg-secondary)',
                        color: 'var(--text-muted)', borderRadius: 4, padding: '2px 8px',
                      }}>
                        {h}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {lightbox.source_title}
                </p>
              </div>
            </motion.div>

            <button
              onClick={() => setLightbox(null)}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '50%', width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white',
              }}
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .img-overlay:hover { background: rgba(0,0,0,0.35) !important; }
        .img-overlay:hover .zoom-icon { opacity: 1 !important; }
      `}</style>
    </>
  )
}
