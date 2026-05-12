import { describe, it, expect } from 'vitest'
import {
  mapCastMember,
  mapCrewMember,
  mapMovieDetails,
  mapWatchProvidersBR,
} from '@/lib/tmdb/mappers'
import type { TmdbMovieDetails } from '@/lib/tmdb/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const validMovieDetails: TmdbMovieDetails = {
  id: 550,
  title: 'Clube da Luta',
  original_title: 'Fight Club',
  original_language: 'en',
  overview: 'Um escriturário insatisfeito forma um clube de luta.',
  release_date: '1999-10-15',
  runtime: 139,
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  backdrop_path: '/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
  ],
  popularity: 95.2,
  vote_average: 8.8,
  vote_count: 2100000,
  external_ids: {
    imdb_id: 'tt0137523',
    wikidata_id: null,
    facebook_id: null,
    instagram_id: null,
    twitter_id: null,
  },
  credits: {
    cast: [
      {
        id: 819,
        name: 'Edward Norton',
        character: 'O Narrador',
        order: 0,
        profile_path: '/8nytsqL59SFJTVYVrN72k6qkGgJ.jpg',
        known_for_department: 'Acting',
      },
    ],
    crew: [
      {
        id: 7467,
        name: 'David Fincher',
        job: 'Director',
        department: 'Directing',
        profile_path: '/tpEczFclQZeKAiCeKZZ0adRvtfz.jpg',
        known_for_department: 'Directing',
      },
      {
        id: 12345,
        name: 'Jim Uhls',
        job: 'Screenplay',
        department: 'Writing',
        profile_path: null,
        known_for_department: 'Writing',
      },
    ],
  },
  'watch/providers': {
    id: 550,
    results: {
      BR: {
        link: 'https://www.justwatch.com/br/filme/clube-da-luta',
        flatrate: [
          {
            provider_id: 8,
            provider_name: 'Netflix',
            logo_path: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg',
            display_priority: 1,
          },
        ],
        rent: [
          {
            provider_id: 2,
            provider_name: 'Apple TV',
            logo_path: '/peURlLlr8jggOwK53fJ5wdQl05y.jpg',
            display_priority: 3,
          },
        ],
      },
    },
  },
}

// ─── mapMovieDetails ──────────────────────────────────────────────────────────

describe('mapMovieDetails', () => {
  it('mapeia campos básicos do filme corretamente', () => {
    const { movie } = mapMovieDetails(validMovieDetails)

    expect(movie.tmdb_id).toBe(550)
    expect(movie.imdb_id).toBe('tt0137523')
    expect(movie.title_pt).toBe('Clube da Luta')
    expect(movie.title_original).toBe('Fight Club')
    expect(movie.original_language).toBe('en')
    expect(movie.release_date).toBe('1999-10-15')
    expect(movie.runtime).toBe(139)
  })

  it('constrói URLs de imagem com tamanhos corretos', () => {
    const { movie } = mapMovieDetails(validMovieDetails)

    expect(movie.poster_url).toBe('https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg')
    expect(movie.backdrop_url).toBe(
      'https://image.tmdb.org/t/p/original/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg',
    )
  })

  it('extrai IDs de gêneros como array de inteiros', () => {
    const { movie } = mapMovieDetails(validMovieDetails)
    expect(movie.genres).toEqual([18, 53])
  })

  it('mapeia elenco com personagem e ordem', () => {
    const { cast } = mapMovieDetails(validMovieDetails)

    expect(cast).toHaveLength(1)
    expect(cast[0]?.person.name).toBe('Edward Norton')
    expect(cast[0]?.character).toBe('O Narrador')
    expect(cast[0]?.order).toBe(0)
  })

  it('mapeia apenas diretor e roteiristas da equipe técnica', () => {
    const { crew } = mapMovieDetails(validMovieDetails)

    expect(crew).toHaveLength(2)
    const jobs = crew.map((c) => c.job)
    expect(jobs).toContain('Director')
    expect(jobs).toContain('Screenplay')
  })

  it('mapeia streamings BR com link de deeplink', () => {
    const { streamingBR } = mapMovieDetails(validMovieDetails)

    expect(streamingBR).toHaveLength(2)
    const netflix = streamingBR.find((s) => s.provider_name === 'Netflix')
    expect(netflix?.type).toBe('flatrate')
    expect(netflix?.region).toBe('BR')
    expect(netflix?.link).toBe('https://www.justwatch.com/br/filme/clube-da-luta')
  })

  it('lança erro quando imdb_id está ausente', () => {
    const detailsSemImdb: TmdbMovieDetails = {
      ...validMovieDetails,
      external_ids: { ...validMovieDetails.external_ids, imdb_id: null },
    }

    expect(() => mapMovieDetails(detailsSemImdb)).toThrow(/não tem imdb_id/)
  })

  it('lança erro quando imdb_id tem formato inválido', () => {
    const detailsImdbErrado: TmdbMovieDetails = {
      ...validMovieDetails,
      external_ids: { ...validMovieDetails.external_ids, imdb_id: 'invalid' },
    }

    expect(() => mapMovieDetails(detailsImdbErrado)).toThrow(/formato inválido/)
  })

  it('aceita imdb_id com 7 dígitos (mínimo)', () => {
    const details7: TmdbMovieDetails = {
      ...validMovieDetails,
      external_ids: { ...validMovieDetails.external_ids, imdb_id: 'tt1234567' },
    }
    expect(() => mapMovieDetails(details7)).not.toThrow()
  })

  it('overview vazio mapeia para null', () => {
    const { movie } = mapMovieDetails({ ...validMovieDetails, overview: '' })
    expect(movie.overview_pt).toBeNull()
  })

  it('runtime null preserva null', () => {
    const { movie } = mapMovieDetails({ ...validMovieDetails, runtime: null })
    expect(movie.runtime).toBeNull()
  })

  it('poster_path null mapeia para null', () => {
    const { movie } = mapMovieDetails({ ...validMovieDetails, poster_path: null })
    expect(movie.poster_url).toBeNull()
  })
})

// ─── mapCastMember ────────────────────────────────────────────────────────────

describe('mapCastMember', () => {
  it('mapeia nome e tmdb_id', () => {
    const person = mapCastMember(validMovieDetails.credits.cast[0]!)
    expect(person.tmdb_id).toBe(819)
    expect(person.name).toBe('Edward Norton')
    expect(person.known_for).toBe('Acting')
  })

  it('constrói URL de perfil corretamente', () => {
    const person = mapCastMember(validMovieDetails.credits.cast[0]!)
    expect(person.profile_url).toBe(
      'https://image.tmdb.org/t/p/w185/8nytsqL59SFJTVYVrN72k6qkGgJ.jpg',
    )
  })

  it('profile_path null mapeia para null', () => {
    const person = mapCastMember({
      ...validMovieDetails.credits.cast[0]!,
      profile_path: null,
    })
    expect(person.profile_url).toBeNull()
  })
})

// ─── mapCrewMember ────────────────────────────────────────────────────────────

describe('mapCrewMember', () => {
  it('mapeia diretor corretamente', () => {
    const director = validMovieDetails.credits.crew.find((c) => c.job === 'Director')!
    const person = mapCrewMember(director)
    expect(person.tmdb_id).toBe(7467)
    expect(person.name).toBe('David Fincher')
    expect(person.known_for).toBe('Directing')
  })
})

// ─── mapWatchProvidersBR ──────────────────────────────────────────────────────

describe('mapWatchProvidersBR', () => {
  it('retorna array vazio quando BR está ausente', () => {
    expect(mapWatchProvidersBR(undefined)).toEqual([])
  })

  it('mapeia flatrate e rent separadamente', () => {
    const brData = validMovieDetails['watch/providers'].results['BR']!
    const result = mapWatchProvidersBR(brData)

    expect(result).toHaveLength(2)
    expect(result.find((r) => r.type === 'flatrate')?.provider_name).toBe('Netflix')
    expect(result.find((r) => r.type === 'rent')?.provider_name).toBe('Apple TV')
  })

  it('todos os itens têm region BR', () => {
    const brData = validMovieDetails['watch/providers'].results['BR']!
    const result = mapWatchProvidersBR(brData)
    expect(result.every((r) => r.region === 'BR')).toBe(true)
  })

  it('retorna array vazio quando não há providers em nenhum tipo', () => {
    const result = mapWatchProvidersBR({ link: 'https://justwatch.com' })
    expect(result).toEqual([])
  })
})
