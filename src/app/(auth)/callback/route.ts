import { NextResponse } from 'next/server'

// Implementado no Bloco 9 (Auth)
export async function GET() {
  return NextResponse.redirect(
    new URL('/', process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
  )
}
