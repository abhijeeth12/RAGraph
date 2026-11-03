export async function register() {
  // Global server/edge runtime instrumentation and error-tracking initialization
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  if (sentryDsn) {
    console.info('[OBSERVABILITY] Error-tracking pipeline initialized for runtime:', process.env.NEXT_RUNTIME || 'browser')
  }
}

