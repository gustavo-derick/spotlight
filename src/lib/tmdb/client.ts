import type {
  TmdbEmbeddableVideo,
  TmdbGenreListResponse,
  TmdbMovieDetails,
  TmdbMovieListResponse,
  TmdbVideo,
  TmdbVideosResponse,
} from './types'

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

function isEmbeddableVideo(video: TmdbVideo): video is TmdbEmbeddableVideo {
  return video.site === 'YouTube' || video.site === 'Vimeo'
}

function trailerScore(video: TmdbEmbeddableVideo): number {
  let score = 0
  if (video.official) score += 100
  if (video.site === 'YouTube') score += 20
  if (video.iso_639_1 === 'pt') score += 10
  if (video.iso_3166_1 === 'BR') score += 5
  if (/trailer/i.test(video.name)) score += 5
  score += Math.min(video.size || 0, 1080) / 1000
  return score
}

function selectPreferredTrailer(videos: TmdbVideo[]): TmdbEmbeddableVideo | null {
  const trailers = videos.filter(isEmbeddableVideo).filter((video) => video.type === 'Trailer')

  trailers.sort((a, b) => {
    const scoreDiff = trailerScore(b) - trailerScore(a)
    if (scoreDiff !== 0) return scoreDiff
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })

  return trailers[0] ?? null
}

/**
 * Busca vídeos cadastrados na TMDB para um filme.
 *
 * @param tmdbId    ID numérico do filme na TMDB
 * @param language  Idioma da resposta da TMDB
 */
export async function fetchMovieVideos(
  tmdbId: number,
  language = 'pt-BR',
): Promise<TmdbVideosResponse> {
  return tmdbFetch<TmdbVideosResponse>(`/movie/${tmdbId}/videos`, { language }, 3600)
}

/**
 * Busca o melhor trailer embutível disponível. Prioriza trailers oficiais em
 * português e usa inglês como fallback, pois muitos filmes não têm trailer BR.
 */
export async function fetchMovieTrailer(tmdbId: number): Promise<TmdbEmbeddableVideo | null> {
  const localizedVideos = await fetchMovieVideos(tmdbId, 'pt-BR')
  const localizedTrailer = selectPreferredTrailer(localizedVideos.results)
  if (localizedTrailer) return localizedTrailer

  const fallbackVideos = await fetchMovieVideos(tmdbId, 'en-US')
  return selectPreferredTrailer(fallbackVideos.results)
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
