'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
}

export function ItsuaSidePeeker({ onStartDemo, onOpenDashboard }: Props) {
  const [dataState, setDataState] = useState<'peek' | ''>('')
  const peekerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Proximity detection listener: Math.hypot(dx, dy) < 140px triggers peek
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const el = peekerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const dx = Math.max(0, rect.left - e.clientX, e.clientX - rect.right)
      const dy = Math.max(0, rect.top - e.clientY, e.clientY - rect.bottom)
      const distance = Math.hypot(dx, dy)

      if (distance < 140) {
        setDataState('peek')
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          if (!el.matches(':hover')) {
            setDataState('')
          }
        }, 1400)
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const tabs = [
    {
      label: 'DEMO',
      colorBg: 'bg-[#FF7A00]',
      action: onStartDemo,
      title: 'Try Interactive Demo',
    },
    {
      label: 'STUDY',
      colorBg: 'bg-[#2F4CFF]',
      action: onOpenDashboard,
      title: 'Open Notebooks Workspace',
    },
    {
      label: 'START',
      colorBg: 'bg-[#047857]',
      action: () => {
        const el = document.getElementById('start')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      },
      title: 'Jump to Decision Matrix',
    },
  ]

  return (
    <div
      ref={peekerRef}
      id="popup-side"
      data-state={dataState}
      className="pointer-events-none fixed top-1/2 left-0 z-40 hidden lg:flex -translate-y-1/2 flex-col gap-2.5"
    >
      {tabs.map((tab) => {
        return (
          <button
            key={tab.label}
            type="button"
            onClick={tab.action}
            title={tab.title}
            aria-label={tab.title}
            className="popup-tab pointer-events-auto inline-flex cursor-pointer items-center font-mono text-[11px] tracking-wide border-0 p-0 bg-transparent w-[98px] h-[36px]"
          >
            <span className="w-[66px] h-full flex items-center justify-center bg-[#0E1012] text-white font-bold select-none">
              {tab.label}
            </span>
            <span className={`w-[32px] h-full flex items-center justify-center ${tab.colorBg} text-white font-bold select-none`}>
              →
            </span>
          </button>
        )
      })}
    </div>
  )
}
