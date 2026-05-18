import { type NextRequest, NextResponse } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Atualiza os cookies da sessão do Supabase (renovação do token e roteamento auth)
  let response = await updateSession(request)

  // HTTPS redirect (em produção)
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') === 'http'
  ) {
    const url = new URL(request.nextUrl.pathname, `https://${request.headers.get('host')}`)
    url.search = request.nextUrl.search
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
