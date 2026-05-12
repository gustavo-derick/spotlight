'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Cria um cliente Supabase para Client Components.
 *
 * Usa variáveis públicas (NEXT_PUBLIC_*) — nunca expõe service_role.
 * Chame dentro de componentes que precisam de reatividade de auth ou queries.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
