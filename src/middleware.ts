import { type NextRequest, NextResponse } from 'next/server'

// Auth refresh + headers de segurança implementados no Bloco 9/10
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // HTTPS redirect (em produção)
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') === 'http'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
    )
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
