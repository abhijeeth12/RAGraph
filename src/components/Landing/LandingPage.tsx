import { useState } from 'react'
import { useSearchStore } from '@/store/useSearchStore'
import AuthModal from '@/components/AuthModal'
import { CreateNotebookModal } from '@/components/Dashboard/CreateNotebookModal'
import type { FocusMode } from '@/lib/types'
import { ItsuaHeader } from './ItsuaHeader'
import { ItsuaHeroSection } from './ItsuaHeroSection'
import { ItsuaMetricsStrip } from './ItsuaMetricsStrip'
import { ItsuaStartSection } from './ItsuaStartSection'
import { ItsuaWorkDeck } from './ItsuaWorkDeck'
import { ItsuaReviewsSection } from './ItsuaReviewsSection'
import { ItsuaCloserSection } from './ItsuaCloserSection'
import { ItsuaFooter } from './ItsuaFooter'
import { ItsuaSidePeeker } from './ItsuaSidePeeker'
import { ItsuaConsent } from './ItsuaConsent'

interface Props {
  onStartDemo: () => void
  onOpenDashboard: () => void
  onSelectNotebook?: (id: string) => void
}

export function LandingPage({ onStartDemo, onOpenDashboard, onSelectNotebook }: Props) {
  const store = useSearchStore()
  const {
    user,
    openGuestDemo,
    createNotebook,
    setActiveNotebookId,
    authModalOpen,
    setAuthModalOpen,
    setPendingAuthDestination,
  } = store
  const [authOpen, setAuthOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const handleStartGuest = () => {
    openGuestDemo()
    onStartDemo()
  }

  const handleOpenDashboard = () => {
    onOpenDashboard()
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
        backgroundColor: '#FFFFFF',
        color: '#0E1012',
        overflowX: 'hidden',
        position: 'relative',
        fontFamily: "'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ─── Band 00: Sticky Header & Navigation (ITSUA 58px Architectural Bar) ─── */}
      <ItsuaHeader
        user={user}
        onStartDemo={handleStartGuest}
        onOpenDashboard={handleOpenDashboard}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* ─── Band 01: Hero Section (Authentic Itsua 12-Line Parallax & Display Headline) ─── */}
      <ItsuaHeroSection
        onStartDemo={handleStartGuest}
        onOpenDashboard={handleOpenDashboard}
      />

      {/* ─── Band 02: Credentials & Metrics Telemetry Strip (5-Column) ─── */}
      <ItsuaMetricsStrip />

      {/* ─── Band 03: Decision Matrix (§ 01 /start Table Routing) ─── */}
      <ItsuaStartSection />

      {/* ─── Band 04: 3D Featured Work Deck (§ 02 /work Fanned Perspective Cards) ─── */}
      <ItsuaWorkDeck
        onSelectNotebook={handleSelectNotebook}
        onOpenDashboard={handleOpenDashboard}
      />

      {/* ─── Band 05: Client Reviews & Case Studies (§ 03 /reviews Split View) ─── */}
      <ItsuaReviewsSection />

      {/* ─── Band 06: Dark High-Contrast Closer & SLA (§ 04 #0E1012 Substrate) ─── */}
      <ItsuaCloserSection
        onStartDemo={handleStartGuest}
        onOpenDashboard={handleOpenDashboard}
      />

      {/* ─── Band 09: Monospace Technical Meta Footer ─── */}
      <ItsuaFooter
        onStartDemo={handleStartGuest}
        onOpenDashboard={handleOpenDashboard}
      />

      {/* ─── Persistent Proximity Side Peeker Tabs (#popup-side) ─── */}
      <ItsuaSidePeeker
        onStartDemo={handleStartGuest}
        onOpenDashboard={handleOpenDashboard}
      />

      {/* ─── Privacy & Telemetry Notice (#consent) ─── */}
      <ItsuaConsent />

      {/* ─── Create Notebook Modal (when signed in) ─── */}
      <CreateNotebookModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateNotebook}
      />

      {/* ─── Authentication Modal ─── */}
      <AuthModal isOpen={isAuthModalVisible} onClose={handleCloseAuth} />
    </div>
  )
}
