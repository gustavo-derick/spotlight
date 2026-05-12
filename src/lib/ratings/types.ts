import type { RatingSource } from '@/types/database'

/** Resultado de um único rating retornado por um provider. */
export interface RatingResult {
  source: RatingSource
  score: number
  score_max: number
  votes: number | null
  url: string | null
}

/**
 * Resposta agregada de ratings para um filme.
 * Um provider pode retornar 1 ou mais fontes de uma vez.
 */
export type RatingsResponse = RatingResult[]

/** Erro estruturado retornado por um provider de ratings. */
export interface RatingsError {
  code: 'NOT_FOUND' | 'RATE_LIMITED' | 'INVALID_IMDB_ID' | 'UPSTREAM_ERROR'
  message: string
  imdbId: string
}
