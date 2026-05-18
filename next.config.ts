import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

// Domínios do Supabase — usa wildcard para cobrir preview branches
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : '*.supabase.co'

/**
 * Content Security Policy estrita.
 * unsafe-eval necessário apenas em dev (hot-reload do Next.js).
 * unsafe-inline em style-src necessário para Tailwind v4 em runtime.
 */
const cspDirectives = [
  "default-src 'self'",
  isDev ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" : "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  [
    'img-src',
    "'self'",
    'blob:',
    'data:',
    'https://image.tmdb.org',
    'https://media.themoviedb.org',
    'https://www.themoviedb.org',
    'https://logo.clearbit.com',
  ].join(' '),
  [
    'connect-src',
    "'self'",
    `https://${supabaseHost}`,
    `wss://${supabaseHost}`,
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://api.rapidapi.com',
    'https://api.themoviedb.org',
  ].join(' '),
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  'upgrade-insecure-requests',
]
  .filter(Boolean)
  .join('; ')

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspDirectives,
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
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
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      // Logos dos provedores de streaming (JustWatch via TMDB)
      {
        protocol: 'https',
        hostname: 'media.themoviedb.org',
        pathname: '/t/p/**',
      },
      // Logos via Clearbit (Streaming & Ratings)
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
        pathname: '/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
