import { z } from 'zod'
import type { RatingsProvider } from './client'
import { assertValidImdbId } from './client'
import type { RatingsError, RatingsResponse } from './types'

const RAPIDAPI_HOST = 'movies-ratings2.p.rapidapi.com'

const ApiResponseSchema = z.object({
  imdbId: z.string().optional(),
  ratings: z
    .object({
      imdb: z
        .object({
          score: z.number(),
          reviewsCount: z.number().optional(),
          url: z.string().optional(),
        })
        .optional(),
      rotten_tomatoes: z
        .object({
          tomatometer: z.number().optional(),
          tomatometerReviewsCount: z.number().optional(),
          url: z.string().optional(),
        })
        .optional(),
      letterboxd: z
        .object({
          score: z.number().optional(),
          url: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
})

type ApiResponse = z.infer<typeof ApiResponseSchema>

function mapToRatings(data: ApiResponse, imdbId: string): RatingsResponse {
  const ratings: RatingsResponse = []
  const r = data.ratings

  if (r?.imdb?.score != null) {
    ratings.push({
      source: 'imdb',
      score: r.imdb.score,
      score_max: 10,
      votes: r.imdb.reviewsCount ?? null,
      url: r.imdb.url ?? `https://www.imdb.com/title/${imdbId}/`,
    })
  }

  if (r?.rotten_tomatoes?.tomatometer != null) {
    ratings.push({
      source: 'rotten_tomatoes',
      score: r.rotten_tomatoes.tomatometer,
      score_max: 100,
      votes: r.rotten_tomatoes.tomatometerReviewsCount ?? null,
      url: r.rotten_tomatoes.url ?? null,
    })
  }

  if (r?.letterboxd?.score != null) {
    ratings.push({
      source: 'letterboxd',
      score: r.letterboxd.score,
      score_max: 5,
      votes: null,
      url: r.letterboxd.url ?? null,
    })
  }

  return ratings
}

export class RapidApiRatingsProvider implements RatingsProvider {
  /**
   * Busca ratings de IMDb, Rotten Tomatoes e Letterboxd via movies-ratings2 (RapidAPI).
   *
   * Endpoint: GET https://movies-ratings2.p.rapidapi.com/ratings?id={imdbId}
   *
   * Escalas retornadas:
   *  - IMDb: 0–10 (score_max 10)
   *  - Rotten Tomatoes: tomatometer 0–100 (score_max 100)
   *  - Letterboxd: 0–5 (score_max 5)
   *
   * @param imdbId  IMDb ID no formato `tt\d{7,}`
   * @returns       Array de RatingResult com as fontes disponíveis na resposta
   * @throws        RatingsError para erros previstos (NOT_FOUND, RATE_LIMITED, UPSTREAM_ERROR)
   */
  async getRatings(imdbId: string): Promise<RatingsResponse> {
    assertValidImdbId(imdbId)

    const apiKey = process.env.RAPIDAPI_KEY
    if (!apiKey) {
      throw {
        code: 'UPSTREAM_ERROR',
        message: 'RAPIDAPI_KEY não configurada',
        imdbId,
      } satisfies RatingsError
    }

    let response: Response
    try {
      response = await fetch(
        `https://${RAPIDAPI_HOST}/ratings?id=${imdbId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': RAPIDAPI_HOST,
            'x-rapidapi-key': apiKey,
          },
        },
      )
    } catch (cause) {
      throw {
        code: 'UPSTREAM_ERROR',
        message: `Falha na conexão com RapidAPI: ${cause instanceof Error ? cause.message : String(cause)}`,
        imdbId,
      } satisfies RatingsError
    }

    if (response.status === 404) {
      throw {
        code: 'NOT_FOUND',
        message: `Filme não encontrado na RapidAPI: ${imdbId}`,
        imdbId,
      } satisfies RatingsError
    }

    if (response.status === 429) {
      throw {
        code: 'RATE_LIMITED',
        message: 'RapidAPI rate limit atingido',
        imdbId,
      } satisfies RatingsError
    }

    if (!response.ok) {
      throw {
        code: 'UPSTREAM_ERROR',
        message: `RapidAPI retornou status ${response.status}`,
        imdbId,
      } satisfies RatingsError
    }

    let json: unknown
    try {
      json = await response.json()
    } catch {
      throw {
        code: 'UPSTREAM_ERROR',
        message: 'RapidAPI retornou JSON inválido',
        imdbId,
      } satisfies RatingsError
    }

    const parsed = ApiResponseSchema.safeParse(json)
    if (!parsed.success) {
      throw {
        code: 'UPSTREAM_ERROR',
        message: `Schema inesperado da RapidAPI: ${parsed.error.message}`,
        imdbId,
      } satisfies RatingsError
    }

    return mapToRatings(parsed.data, imdbId)
  }
}

/** Instância singleton do provider — use esta nos módulos consumers. */
export const ratingsProvider: RatingsProvider = new RapidApiRatingsProvider()
