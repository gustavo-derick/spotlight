import { z } from 'zod'

// Variáveis server-only — nunca exportar para o client
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY é obrigatória')
    .refine((v) => v.startsWith('eyJ'), {
      message: 'SUPABASE_SERVICE_ROLE_KEY deve ser um JWT válido (começa com eyJ)',
    }),

  TMDB_API_KEY: z
    .string()
    .min(32, 'TMDB_API_KEY deve ter pelo menos 32 caracteres')
    .regex(/^[a-f0-9]+$/, 'TMDB_API_KEY deve conter apenas caracteres hexadecimais'),

  RAPIDAPI_KEY: z.string().min(20, 'RAPIDAPI_KEY deve ter pelo menos 20 caracteres'),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

// Variáveis disponíveis no client (prefixo NEXT_PUBLIC_)
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida')
    .refine((v) => v.includes('.supabase.co'), {
      message: 'NEXT_PUBLIC_SUPABASE_URL deve ser um projeto Supabase',
    }),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória')
    .refine((v) => v.startsWith('eyJ'), {
      message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY deve ser um JWT válido (começa com eyJ)',
    }),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL deve ser uma URL válida')
    .default('http://localhost:3000'),
})

function parseEnv<T extends z.ZodTypeAny>(schema: T, source: Record<string, string | undefined>) {
  const result = schema.safeParse(source)
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const messages = Object.entries(errors)
      .map(([field, msgs]) => `  ${field}: ${(msgs as string[]).join(', ')}`)
      .join('\n')
    throw new Error(`Variáveis de ambiente inválidas ou ausentes:\n${messages}`)
  }
  return result.data as z.infer<T>
}

// Em testes, permite omitir vars server-only usando schema parcial
const isTest = process.env['NODE_ENV'] === 'test'

export const serverEnv = isTest
  ? parseEnv(serverSchema.partial(), process.env)
  : parseEnv(serverSchema, process.env)

export const clientEnv = parseEnv(clientSchema, process.env)

export type ServerEnv = z.infer<typeof serverSchema>
export type ClientEnv = z.infer<typeof clientSchema>
