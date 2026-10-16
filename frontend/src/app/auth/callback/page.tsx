'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { googleCallback, cleanupSession } from '@/lib/api'
import { useSearchStore } from '@/store/useSearchStore'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setUser = useSearchStore((s) => s.setUser)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      router.push('/?error=No+code+provided')
      return
    }

    async function handleAuth() {
      try {
        const result = await googleCallback(code as string)
        
        const state = useSearchStore.getState()
        if (!state.user && state.session_id) {
          cleanupSession(state.session_id).catch(() => {})
        }
        
        setUser(
          { user_id: result.user.user_id, email: result.user.email },
          result.access_token
        )
        router.push('/')
      } catch (error) {
        console.error('Google auth error', error)
        router.push('/?error=Google+login+failed')
      }
    }

    handleAuth()
  }, [searchParams, router, setUser])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'black' }}>
      <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>Completing Sign In...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{height: '100vh', background: 'black'}}></div>}>
      <CallbackHandler />
    </Suspense>
  )
}
