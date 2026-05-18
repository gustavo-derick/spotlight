import { z } from 'zod'

/**
 * Schema de validação para parâmetros da rota GET /api/search.
 * Todos os campos são opcionais exceto limit/offset que têm defaults.
 */
export const searchApiSchema = z.object({
  q: z.string().max(200).trim().optional(),
  genres: z.string().optional(),
  yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  minImdbScore: z.coerce.number().min(0).max(10).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export type SearchApiParams = z.infer<typeof searchApiSchema>

export interface SearchMovie {
  id: string
  title_pt: string
  title_original: string
  poster_url: string | null
  release_date: string | null
  genres: number[]
  // Retornado pela função search_movies_full como JSONB agregado
  movie_ratings: { source: string; score: number }[]
}

export interface SearchResult {
  movies: SearchMovie[]
  hasMore: boolean
}

/**
 * Extrai e valida os genre IDs da string CSV recebida na query string.
 * Descarta valores não-numéricos ou menores que 1.
 *
 * @param genres - String CSV, ex: "28,12,16"
 * @returns Array de inteiros positivos, ou null se vazio/ausente
 */
export function parseGenreIds(genres: string | undefined): number[] | null {
  if (!genres) return null
  const ids = genres
    .split(',')
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
  return ids.length > 0 ? ids : null
}

/**
 * Sanitiza o texto de busca para uso em filtros PostgREST .or().
 * Remove vírgulas e parênteses que quebrariam o parser de filtros.
 *
 * @param q - Texto de busca bruto
 * @returns Texto sanitizado, ou null se inválido/muito curto
 */
export function sanitizeQuery(q: string | undefined): string | null {
  if (!q || q.length < 2) return null
  const safe = q.replace(/[,()]/g, ' ').trim()
  return safe.length >= 2 ? safe : null
}
