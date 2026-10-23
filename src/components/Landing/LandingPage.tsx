import { useState } from 'react'
import { useSearchStore } from '@/store/useSearchStore'
import AuthModal from '@/components/AuthModal'
import { CreateNotebookModal } from '@/components/Dashboard/CreateNotebookModal'
import type { FocusMode } from '@/lib/types'
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
  const store = useSearchStore()
  const { user, openGuestDemo, createNotebook, setActiveNotebookId, authModalOpen, setAuthModalOpen, setPendingAuthDestination } = store
  const [authOpen, setAuthOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const handleStartGuest = () => {
    openGuestDemo()
    onStartDemo()
  }

  const handleOpenDashboard = () => {
    if (!user) {
      setPendingAuthDestination('dashboard')
      setAuthModalOpen(true)
      setAuthOpen(true)
    } else {
      onOpenDashboard()
    }
  }

  const handleSelectNotebook = (id: string) => {
    if (!user && id !== 'nb-tree-rag') {
      setPendingAuthDestination(`notebook/${id}`)
      setAuthModalOpen(true)
      setAuthOpen(true)
      return
    }
    if (onSelectNotebook) {
      onSelectNotebook(id)
    } else {
      handleStartGuest()
    }
  }

  const handleCreateNotebook = async (title: string, description: string, focus: FocusMode) => {
    const newNb = await createNotebook(title, description, focus)
    setActiveNotebookId(newNb.id)
    if (onSelectNotebook) {
      onSelectNotebook(newNb.id)
    } else {
      handleStartGuest()
    }
  }

  const isAuthModalVisible = authOpen || authModalOpen

  const handleCloseAuth = () => {
    setAuthOpen(false)
    setAuthModalOpen(false)
    setPendingAuthDestination(null)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#E3E7EB',
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
        onOpenDashboard={handleOpenDashboard}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* ─── Hero Section (§ 00 - Crox Editorial & Monumental Typography) ─ */}
      <CroxHero
        user={user}
        onStartDemo={handleStartGuest}
        onOpenDashboard={handleOpenDashboard}
        onNewNotebook={() => {
          if (!user) {
            setPendingAuthDestination('dashboard')
            setAuthModalOpen(true)
            setAuthOpen(true)
          } else {
            setCreateModalOpen(true)
          }
        }}
      />

      {/* ─── Running Marquee Ticker (Crox Signature Broad Black Bar) ─── */}
      <CroxTickerBar />

      {/* ─── Core Capabilities Matrix (§ 01 - ITSUA /services 2x2 Grid) ── */}
      <ItsuaServicesMatrix />

      {/* ─── Work Showcase Deck (§ 02 - ITSUA /work Interactive Deck) ──── */}
      <ItsuaWorkDeck
        onSelectNotebook={handleSelectNotebook}
        onOpenDashboard={handleOpenDashboard}
      />

      {/* ─── Empirical Benchmark Matrix (§ 03 - Crox Broad Black Lines) ── */}
      <BenchmarkLedger />

      {/* ─── Dual-Engine Retrieval Matrix Simulator (§ 04) ─────────────── */}
      <DualEngineSimulator />

      {/* ─── Verified Client Reviews (§ 05 - ITSUA /reviews Split View) ─ */}
      <ItsuaReviewsSection />

      {/* ─── Plain English Architecture FAQ (§ 06) ────────────────────── */}
      <ArchitectureFAQ />

      {/* ─── High-Impact Studio Conversion Footer (§ 07) ───────────────── */}
      <ItsuaFooter
        onStartDemo={handleStartGuest}
        onOpenDashboard={handleOpenDashboard}
      />

      {/* ─── Create Notebook Modal (when signed in) ────────────────────── */}
      <CreateNotebookModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateNotebook}
      />

      {/* ─── Auth Modal ───────────────────────────────────────────────── */}
      <AuthModal isOpen={isAuthModalVisible} onClose={handleCloseAuth} />
    </div>
  )
}
