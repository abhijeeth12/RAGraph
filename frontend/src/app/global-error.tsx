'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h2>Something went wrong!</h2>
        <p>{error?.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={() => reset()}
          style={{
            padding: '8px 16px',
            marginTop: 12,
            cursor: 'pointer',
            borderRadius: 6,
            background: '#2563eb',
            color: '#fff',
            border: 'none',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
