import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Cria um cliente Supabase para Server Components e Route Handlers.
 *
 * Lê cookies da request atual via next/headers e escreve cookies na response.
 * O middleware se encarrega da renovação de tokens — erros de setAll em
 * Server Components (somente leitura) são esperados e ignorados com segurança.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Esperado em Server Components (cookies são readonly).
            // O middleware garante que os tokens sejam renovados na próxima request.
          }
        },
      },
    },
  )
}
