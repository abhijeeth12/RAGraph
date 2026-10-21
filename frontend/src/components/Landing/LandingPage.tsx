'use client'
import { useState } from 'react'
import { useSearchStore } from '@/store/useSearchStore'
import AuthModal from '@/components/AuthModal'
import { CroxHeader } from './CroxHeader'
import { CroxHero } from './CroxHero'
import { CroxTickerBar } from './CroxTickerBar'
import { ItsuaServicesMatrix } from './ItsuaServicesMatrix'
import { ItsuaWorkDeck } from './ItsuaWorkDeck'
import { DualEngineSimulator } from './DualEngineSimulator'
import { ItsuaReviewsSection } from './ItsuaReviewsSection'
import { BenchmarkLedger } from './BenchmarkLedger'
import { ArchitectureFAQ } from './ArchitectureFAQ'
import { ItsuaFooter } from './ItsuaFooter'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
  onSelectNotebook?: (id: string) => void
}

export function LandingPage({ onStartDemo, onOpenDashboard, onSelectNotebook }: Props) {
  const { user, openGuestDemo } = useSearchStore()
  const [authOpen, setAuthOpen] = useState(false)

  const handleStartGuest = () => {
    openGuestDemo()
    onStartDemo()
  }

  const handleSelectNotebook = (id: string) => {
    if (onSelectNotebook) {
      onSelectNotebook(id)
    } else {
      handleStartGuest()
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
        overflowX: 'hidden',
        position: 'relative',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ─── Architectural Masthead (Crox Divider Cells + Clean Logo) ─── */}
      <CroxHeader
        user={user}
        onStartDemo={handleStartGuest}
        onOpenDashboard={onOpenDashboard}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* ─── Hero Section (§ 00 - Crox Editorial & Monumental Typography) ─ */}
      <CroxHero
        onStartDemo={handleStartGuest}
        onOpenDashboard={onOpenDashboard}
      />

      {/* ─── Running Marquee Ticker (Crox Signature Broad Black Bar) ─── */}
      <CroxTickerBar />

      {/* ─── Core Capabilities Matrix (§ 01 - ITSUA /services 2x2 Grid) ── */}
      <ItsuaServicesMatrix />

      {/* ─── Work Showcase Deck (§ 02 - ITSUA /work Interactive Deck) ──── */}
      <ItsuaWorkDeck
        onSelectNotebook={handleSelectNotebook}
        onOpenDashboard={onOpenDashboard}
      />

      {/* ─── Dual-Engine Retrieval Matrix Simulator (§ 03) ─────────────── */}
      <DualEngineSimulator />

      {/* ─── Verified Client Reviews (§ 04 - ITSUA /reviews Split View) ─ */}
      <ItsuaReviewsSection />

      {/* ─── Empirical Benchmark Matrix (§ 05 - Crox Broad Black Lines) ── */}
      <BenchmarkLedger />

      {/* ─── Plain English Architecture FAQ (§ 06) ────────────────────── */}
      <ArchitectureFAQ />

      {/* ─── High-Impact Studio Conversion Footer (§ 07) ───────────────── */}
      <ItsuaFooter
        onStartDemo={handleStartGuest}
        onOpenDashboard={onOpenDashboard}
      />

      {/* ─── Auth Modal ───────────────────────────────────────────────── */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
