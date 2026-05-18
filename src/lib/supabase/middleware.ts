import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { clientEnv } from '@/env'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          // Atualiza os cookies da request para os próximos middlewares
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Atualiza a response que será enviada ao cliente
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // REF: Isso vai recarregar o token de acesso (se vencido) base no refresh token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se o usuário não estiver logado e tentar acessar (user)/, redirecionar para login
  if (!user && request.nextUrl.pathname.startsWith('/(user)')) {
    // Isso deve ser resolvido para o path real sem o Route Group, mas a checagem da URL real seria:
    // nextUrl.pathname pode não ter `(user)` nela, depende de como a rota é acessada.
    // As rotas em `(user)/` não aparecem com `(user)` na URL, então precisamos checar
    // os paths reais como /favoritos, /watchlist, /perfil, etc.
  }

  // Redireciona caminhos que precisam de login (adicione os caminhos protegidos aqui)
  const protectedRoutes = ['/favoritos', '/watchlist', '/perfil']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  )

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/entrar'
    url.searchParams.set('redirect_to', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Opcional: Se o usuário estiver logado e for para `/entrar`, redireciona para `/`
  if (user && request.nextUrl.pathname.startsWith('/entrar')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
