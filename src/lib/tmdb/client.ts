import type { TmdbGenreListResponse, TmdbMovieDetails, TmdbMovieListResponse } from './types'

const BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

/** Tamanhos padrão para poster e backdrop. */
export const TMDB_POSTER_SIZE = 'w500' as const
export const TMDB_BACKDROP_SIZE = 'original' as const
export const TMDB_PROFILE_SIZE = 'w185' as const

/**
 * Constrói a URL completa de uma imagem TMDB a partir do path.
 *
 * @param path   Caminho retornado pela API (ex: "/abc123.jpg")
 * @param size   Tamanho desejado (ex: "w500", "original")
 * @returns URL completa ou null se o path for nulo
 */
export function buildImageUrl(path: string | null, size: string): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

/**
 * Wrapper de fetch para a TMDB API v3.
 *
 * Usa a API key como query param, força language=pt-BR e adiciona
 * cache de 1h via Next.js fetch. Em falha, lança Error com contexto.
 */
async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
  revalidate = 3600,
): Promise<T> {
  const url = new URL(BASE_URL + path)
  url.searchParams.set('api_key', process.env.TMDB_API_KEY!)
  url.searchParams.set('language', 'pt-BR')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString(), {
    next: { revalidate },
  })

  if (!response.ok) {
    throw new Error(`TMDB API ${response.status} em ${path}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

/**
 * Busca detalhes completos de um filme com credits, external_ids e watch/providers.
 *
 * O campo external_ids.imdb_id é a chave usada para consultar ratings no RapidAPI.
 * O campo watch/providers é filtrado pela região BR nos mappers.
 *
 * @param tmdbId  ID numérico do filme na TMDB
 */
export async function fetchMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
  return tmdbFetch<TmdbMovieDetails>(`/movie/${tmdbId}`, {
    append_to_response: 'credits,external_ids,watch/providers',
    region: 'BR',
  })
}

/**
 * Busca filmes em cartaz no Brasil.
 *
 * @param page  Página (1-based), padrão 1
 */
export async function fetchNowPlaying(page = 1): Promise<TmdbMovieListResponse> {
  return tmdbFetch<TmdbMovieListResponse>('/movie/now_playing', {
    region: 'BR',
    page: String(page),
  })
}

/**
 * Busca filmes populares no Brasil.
 *
 * @param page  Página (1-based), padrão 1
 */
export async function fetchPopular(page = 1): Promise<TmdbMovieListResponse> {
  return tmdbFetch<TmdbMovieListResponse>('/movie/popular', {
    region: 'BR',
    page: String(page),
  })
}

/**
 * Busca lançamentos recentes no Brasil.
 *
 * @param page  Página (1-based), padrão 1
 */
export async function fetchUpcoming(page = 1): Promise<TmdbMovieListResponse> {
  return tmdbFetch<TmdbMovieListResponse>('/movie/upcoming', {
    region: 'BR',
    page: String(page),
  })
}

/**
 * Busca tendências da semana (filmes).
 *
 * @param page  Página (1-based), padrão 1
 */
export async function fetchTrending(page = 1): Promise<TmdbMovieListResponse> {
  return tmdbFetch<TmdbMovieListResponse>('/trending/movie/week', {
    page: String(page),
  })
}

/**
 * Busca a lista oficial de gêneros de filmes da TMDB.
 */
export async function fetchGenres(): Promise<TmdbGenreListResponse> {
  return tmdbFetch<TmdbGenreListResponse>('/genre/movie/list', {}, 86400) // cache 24h
}
