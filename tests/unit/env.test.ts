import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schemas isolados para teste (mesma lógica de src/env.ts, sem efeitos colaterais de import)
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1)
    .refine((v) => v.startsWith('eyJ')),
  TMDB_API_KEY: z
    .string()
    .min(32)
    .regex(/^[a-f0-9]+$/),
  RAPIDAPI_KEY: z.string().min(20),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .refine((v) => v.includes('.supabase.co')),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1)
    .refine((v) => v.startsWith('eyJ')),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
})

const validServer = {
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
  TMDB_API_KEY: 'abcdef1234567890abcdef1234567890',
  RAPIDAPI_KEY: 'rapidapikey1234567890abcdef',
  NODE_ENV: 'test' as const,
}

const validClient = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://xyzabc123456789.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
}

describe('serverSchema', () => {
  it('aceita um conjunto válido de variáveis', () => {
    const result = serverSchema.safeParse(validServer)
    expect(result.success).toBe(true)
  })

  it('rejeita quando SUPABASE_SERVICE_ROLE_KEY está ausente', () => {
    const { SUPABASE_SERVICE_ROLE_KEY: _omit, ...rest } = validServer
    const result = serverSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejeita SUPABASE_SERVICE_ROLE_KEY que não começa com eyJ', () => {
    const result = serverSchema.safeParse({
      ...validServer,
      SUPABASE_SERVICE_ROLE_KEY: 'invalid-key',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita TMDB_API_KEY com menos de 32 caracteres', () => {
    const result = serverSchema.safeParse({ ...validServer, TMDB_API_KEY: 'curto' })
    expect(result.success).toBe(false)
  })

  it('rejeita TMDB_API_KEY com caracteres não-hex', () => {
    const result = serverSchema.safeParse({
      ...validServer,
      TMDB_API_KEY: 'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // 32 chars mas não hex
    })
    expect(result.success).toBe(false)
  })

  it('rejeita RAPIDAPI_KEY com menos de 20 caracteres', () => {
    const result = serverSchema.safeParse({ ...validServer, RAPIDAPI_KEY: 'curto' })
    expect(result.success).toBe(false)
  })

  it('usa "development" como NODE_ENV padrão', () => {
    const { NODE_ENV: _omit, ...rest } = validServer
    const result = serverSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development')
    }
  })
})

describe('clientSchema', () => {
  it('aceita um conjunto válido de variáveis', () => {
    const result = clientSchema.safeParse(validClient)
    expect(result.success).toBe(true)
  })

  it('rejeita quando NEXT_PUBLIC_SUPABASE_URL está ausente', () => {
    const { NEXT_PUBLIC_SUPABASE_URL: _omit, ...rest } = validClient
    const result = clientSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejeita NEXT_PUBLIC_SUPABASE_URL que não é um projeto Supabase', () => {
    const result = clientSchema.safeParse({
      ...validClient,
      NEXT_PUBLIC_SUPABASE_URL: 'https://meu-banco.exemplo.com',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita NEXT_PUBLIC_SUPABASE_URL sem formato de URL', () => {
    const result = clientSchema.safeParse({
      ...validClient,
      NEXT_PUBLIC_SUPABASE_URL: 'nao-e-uma-url',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita NEXT_PUBLIC_SUPABASE_ANON_KEY que não começa com eyJ', () => {
    const result = clientSchema.safeParse({
      ...validClient,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'chave-invalida',
    })
    expect(result.success).toBe(false)
  })

  it('usa "http://localhost:3000" como NEXT_PUBLIC_APP_URL padrão', () => {
    const { NEXT_PUBLIC_APP_URL: _omit, ...rest } = validClient
    const result = clientSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
    }
  })
})
