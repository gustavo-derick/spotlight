// SERVER-ONLY — não importar de Client Components nem de rotas públicas sem verificação de auth.
// Este cliente usa service_role e bypassa RLS. Qualquer dado retornado por ele
// não passa pelas policies — use exclusivamente em Edge Functions e em Server Actions
// que já verificaram a identidade do chamador.

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cria um cliente Supabase com service_role key.
 *
 * Bypassa Row Level Security — use apenas para:
 *  - Operações de sincronização (Edge Functions)
 *  - Deleção de conta (DELETE /api/account, após verificar auth)
 *  - Leitura de sync_logs e rate_limits
 *
 * @throws Se SUPABASE_SERVICE_ROLE_KEY não estiver definida (capturado pelo env.ts no boot)
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
