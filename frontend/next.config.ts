import type { NextConfig } from 'next'

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://ragraph-backend.onrender.com'
    : 'http://localhost:8000')
).replace(/\/+$/, '')

const nextConfig: NextConfig = {
  // crucial for the multi-stage docker build to keep the image tiny
  output: 'standalone', 
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
      {
        source: '/dashboard',
        destination: '/',
      },
      {
        source: '/workspace',
        destination: '/',
      },
      {
        source: '/notebook/:path*',
        destination: '/',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8000' },
      { protocol: 'http', hostname: 'backend', port: '8000' },
      { protocol: 'https', hostname: 'ragraph-backend.onrender.com' },
    ],
  },
}

export default nextConfig
