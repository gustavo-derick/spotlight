import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { assertValidImdbId, IMDB_ID_REGEX } from '@/lib/ratings/client'
import { RapidApiRatingsProvider } from '@/lib/ratings/rapidapi'
import type { RatingsError } from '@/lib/ratings/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeFetchResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

const FULL_API_RESPONSE = {
  imdbId: 'tt0111161',
  ratings: {
    imdb: {
      score: 9.3,
      reviewsCount: 29000000,
      url: 'https://www.imdb.com/title/tt0111161/',
    },
    rotten_tomatoes: {
      tomatometer: 89,
      tomatometerReviewsCount: 141,
      url: 'https://www.rottentomatoes.com/m/shawshank_redemption',
    },
    letterboxd: {
      score: 4.6,
      url: 'https://letterboxd.com/film/the-shawshank-redemption',
    },
  },
}

// ─── IMDB_ID_REGEX ───────────────────────────────────────────────────────────

describe('IMDB_ID_REGEX', () => {
  it('aceita IDs válidos com 7 dígitos', () => {
    expect(IMDB_ID_REGEX.test('tt1234567')).toBe(true)
  })

  it('aceita IDs válidos com mais de 7 dígitos', () => {
    expect(IMDB_ID_REGEX.test('tt12345678')).toBe(true)
    expect(IMDB_ID_REGEX.test('tt0137523')).toBe(true)
  })

  it('rejeita IDs sem prefixo tt', () => {
    expect(IMDB_ID_REGEX.test('1234567')).toBe(false)
    expect(IMDB_ID_REGEX.test('nm1234567')).toBe(false)
  })

  it('rejeita IDs com menos de 7 dígitos', () => {
    expect(IMDB_ID_REGEX.test('tt123456')).toBe(false)
  })

  it('rejeita string vazia', () => {
    expect(IMDB_ID_REGEX.test('')).toBe(false)
  })
})

// ─── assertValidImdbId ───────────────────────────────────────────────────────

describe('assertValidImdbId', () => {
  it('não lança para ID válido', () => {
    expect(() => assertValidImdbId('tt0137523')).not.toThrow()
  })

  it('lança RatingsError com code INVALID_IMDB_ID para formato errado', () => {
    expect.assertions(2)
    try {
      assertValidImdbId('invalid')
    } catch (err) {
      const error = err as RatingsError
      expect(error.code).toBe('INVALID_IMDB_ID')
      expect(error.imdbId).toBe('invalid')
    }
  })

  it('lança para string vazia', () => {
    expect.assertions(1)
    try {
      assertValidImdbId('')
    } catch (err) {
      expect((err as RatingsError).code).toBe('INVALID_IMDB_ID')
    }
  })
})

// ─── RapidApiRatingsProvider ─────────────────────────────────────────────────

describe('RapidApiRatingsProvider', () => {
  let provider: RapidApiRatingsProvider

  beforeEach(() => {
    provider = new RapidApiRatingsProvider()
    vi.stubEnv('RAPIDAPI_KEY', 'test-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('rejeita imdbId inválido antes de fazer a chamada', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    expect.assertions(2)
    try {
      await provider.getRatings('nao-e-um-imdb-id')
    } catch (err) {
      expect((err as RatingsError).code).toBe('INVALID_IMDB_ID')
    }
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('lança UPSTREAM_ERROR quando RAPIDAPI_KEY não está configurada', async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('RAPIDAPI_KEY', '')

    expect.assertions(1)
    try {
      await provider.getRatings('tt0111161')
    } catch (err) {
      expect((err as RatingsError).code).toBe('UPSTREAM_ERROR')
    }
  })

  describe('happy path — resposta completa', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        makeFetchResponse(200, FULL_API_RESPONSE),
      ))
    })

    it('retorna rating do IMDb com escala correta', async () => {
      const ratings = await provider.getRatings('tt0111161')
      const imdb = ratings.find((r) => r.source === 'imdb')

      expect(imdb).toBeDefined()
      expect(imdb?.score).toBe(9.3)
      expect(imdb?.score_max).toBe(10)
      expect(imdb?.votes).toBe(29000000)
      expect(imdb?.url).toBe('https://www.imdb.com/title/tt0111161/')
    })

    it('retorna tomatometer do Rotten Tomatoes com escala correta', async () => {
      const ratings = await provider.getRatings('tt0111161')
      const rt = ratings.find((r) => r.source === 'rotten_tomatoes')

      expect(rt).toBeDefined()
      expect(rt?.score).toBe(89)
      expect(rt?.score_max).toBe(100)
      expect(rt?.votes).toBe(141)
      expect(rt?.url).toBe('https://www.rottentomatoes.com/m/shawshank_redemption')
    })

    it('retorna rating do Letterboxd com escala correta', async () => {
      const ratings = await provider.getRatings('tt0111161')
      const lb = ratings.find((r) => r.source === 'letterboxd')

      expect(lb).toBeDefined()
      expect(lb?.score).toBe(4.6)
      expect(lb?.score_max).toBe(5)
      expect(lb?.votes).toBeNull()
      expect(lb?.url).toBe('https://letterboxd.com/film/the-shawshank-redemption')
    })

    it('usa o imdbId do parâmetro como fallback na URL do IMDb', async () => {
      const responseWithoutUrl = {
        ...FULL_API_RESPONSE,
        ratings: {
          ...FULL_API_RESPONSE.ratings,
          imdb: { score: 9.3, reviewsCount: 29000000 },
        },
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        makeFetchResponse(200, responseWithoutUrl),
      ))

      const ratings = await provider.getRatings('tt0111161')
      const imdb = ratings.find((r) => r.source === 'imdb')
      expect(imdb?.url).toBe('https://www.imdb.com/title/tt0111161/')
    })
  })

  describe('resposta parcial', () => {
    it('retorna apenas fontes presentes — sem RT nem Letterboxd', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        makeFetchResponse(200, {
          imdbId: 'tt0111161',
          ratings: { imdb: { score: 7.5 } },
        }),
      ))

      const ratings = await provider.getRatings('tt0111161')
      expect(ratings).toHaveLength(1)
      expect(ratings[0]?.source).toBe('imdb')
    })

    it('retorna array vazio quando ratings está ausente', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        makeFetchResponse(200, { imdbId: 'tt0111161' }),
      ))

      const ratings = await provider.getRatings('tt0111161')
      expect(ratings).toHaveLength(0)
    })
  })

  describe('erros HTTP', () => {
    it('lança NOT_FOUND para status 404', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        makeFetchResponse(404, {}),
      ))

      expect.assertions(2)
      try {
        await provider.getRatings('tt0111161')
      } catch (err) {
        const error = err as RatingsError
        expect(error.code).toBe('NOT_FOUND')
        expect(error.imdbId).toBe('tt0111161')
      }
    })

    it('lança RATE_LIMITED para status 429', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        makeFetchResponse(429, {}),
      ))

      expect.assertions(1)
      try {
        await provider.getRatings('tt0111161')
      } catch (err) {
        expect((err as RatingsError).code).toBe('RATE_LIMITED')
      }
    })

    it('lança UPSTREAM_ERROR para outros status de erro', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        makeFetchResponse(500, {}),
      ))

      expect.assertions(1)
      try {
        await provider.getRatings('tt0111161')
      } catch (err) {
        expect((err as RatingsError).code).toBe('UPSTREAM_ERROR')
      }
    })
  })

  describe('erros de conectividade e parsing', () => {
    it('lança UPSTREAM_ERROR quando fetch lança exceção de rede', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      expect.assertions(1)
      try {
        await provider.getRatings('tt0111161')
      } catch (err) {
        expect((err as RatingsError).code).toBe('UPSTREAM_ERROR')
      }
    })

    it('lança UPSTREAM_ERROR quando response.json() lança', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('invalid json')),
      } as unknown as Response))

      expect.assertions(1)
      try {
        await provider.getRatings('tt0111161')
      } catch (err) {
        expect((err as RatingsError).code).toBe('UPSTREAM_ERROR')
      }
    })
  })
})
