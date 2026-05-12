import { describe, it, expect } from 'vitest'
import { assertValidImdbId, IMDB_ID_REGEX } from '@/lib/ratings/client'
import { RapidApiRatingsProvider } from '@/lib/ratings/rapidapi'
import type { RatingsError } from '@/lib/ratings/types'

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

describe('RapidApiRatingsProvider', () => {
  it('rejeita imdbId inválido antes de fazer a chamada', async () => {
    const provider = new RapidApiRatingsProvider()
    expect.assertions(1)
    try {
      await provider.getRatings('nao-e-um-imdb-id')
    } catch (err) {
      expect((err as RatingsError).code).toBe('INVALID_IMDB_ID')
    }
  })

  it('lança UPSTREAM_ERROR para imdbId válido (stub pendente)', async () => {
    const provider = new RapidApiRatingsProvider()
    expect.assertions(1)
    try {
      await provider.getRatings('tt0137523')
    } catch (err) {
      expect((err as RatingsError).code).toBe('UPSTREAM_ERROR')
    }
  })
})
