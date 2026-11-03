'use client'
import { useState, useEffect } from 'react'

export function ItsuaConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show if user hasn't made a choice yet
    const stored = localStorage.getItem('ragraph_consent')
    if (!stored) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!isVisible) return null

  const handleChoice = (choice: 'granted' | 'denied') => {
    localStorage.setItem('ragraph_consent', choice)
    setIsVisible(false)
  }

  return (
    <div
      id="consent"
      role="dialog"
      aria-label="Privacy & analytics notice"
      className="fixed right-3 bottom-3 left-3 z-[900] flex flex-col border border-line bg-white font-mono text-[12.5px] shadow-2xl sm:right-5 sm:bottom-5 sm:left-auto sm:w-[380px] rounded-[2px]"
      style={{
        animation: 'consent-in 0.4s cubic-bezier(0.33, 0.9, 0.3, 1) both',
      }}
    >
      <p className="m-0 px-5 py-4 text-sub text-[12px] leading-relaxed">
        Study Space uses privacy-friendly analytics to monitor response speeds and
        ensure citation accuracy. Zero study data is shared or retained for AI training.
      </p>
      <div className="flex border-t border-line">
        <button
          type="button"
          onClick={() => handleChoice('denied')}
          className="px-4 py-3 whitespace-nowrap cursor-pointer flex-1 text-[#0E1012] hover:bg-paper font-mono text-[11px] font-bold border-0 bg-transparent transition-colors text-center"
        >
          DECLINE
        </button>
        <button
          type="button"
          onClick={() => handleChoice('granted')}
          className="px-4 py-3 whitespace-nowrap cursor-pointer flex-1 bg-[#0E1012] text-white hover:bg-[#1a1e22] font-mono text-[11px] font-bold border-0 border-l border-line transition-colors text-center"
        >
          ACCEPT
        </button>
      </div>
    </div>
  )
}

