// Shapes das respostas da TMDB API v3.
// Apenas os campos que o Spotlight usa — não espelhar o schema inteiro da TMDB.

// ─── Primitivos ────────────────────────────────────────────────────────────────

export interface TmdbGenre {
  id: number
  name: string
}

export interface TmdbImage {
  file_path: string
  width: number
  height: number
}

// ─── Pessoa (ator/diretor) ────────────────────────────────────────────────────

export interface TmdbCastMember {
  id: number
  name: string
  character: string
  order: number
  profile_path: string | null
  known_for_department: string
}

export interface TmdbCrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
  known_for_department: string
}

export interface TmdbCredits {
  cast: TmdbCastMember[]
  crew: TmdbCrewMember[]
}

// ─── IDs externos ─────────────────────────────────────────────────────────────

export interface TmdbExternalIds {
  imdb_id: string | null
  wikidata_id: string | null
  facebook_id: string | null
  instagram_id: string | null
  twitter_id: string | null
}

// ─── Watch Providers ──────────────────────────────────────────────────────────

export interface TmdbWatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string
  display_priority: number
}

export interface TmdbWatchProvidersByType {
  link: string
  flatrate?: TmdbWatchProvider[]
  rent?: TmdbWatchProvider[]
  buy?: TmdbWatchProvider[]
  ads?: TmdbWatchProvider[]
}

export interface TmdbWatchProvidersResponse {
  id: number
  results: {
    [region: string]: TmdbWatchProvidersByType
  }
}

// ─── Vídeos ──────────────────────────────────────────────────────────────────

export interface TmdbVideo {
  id: string
  iso_639_1: string
  iso_3166_1: string
  key: string
  name: string
  site: string
  size: number
  type: string
  official: boolean
  published_at: string
}

export type TmdbVideoSite = 'YouTube' | 'Vimeo'

export type TmdbEmbeddableVideo = TmdbVideo & {
  site: TmdbVideoSite
}

export interface TmdbVideosResponse {
  id: number
  results: TmdbVideo[]
}

// ─── Filme ────────────────────────────────────────────────────────────────────

export interface TmdbMovie {
  id: number
  title: string
  original_title: string
  original_language: string
  overview: string
  release_date: string
  poster_path: string | null
  backdrop_path: string | null
  genre_ids: number[]
  popularity: number
  vote_average: number
  vote_count: number
}

/** Detalhes completos — resultado de /movie/{id}?append_to_response=credits,external_ids,watch/providers */
export interface TmdbMovieDetails {
  id: number
  title: string
  original_title: string
  original_language: string
  overview: string
  release_date: string
  runtime: number | null
  poster_path: string | null
  backdrop_path: string | null
  genres: TmdbGenre[]
  popularity: number
  vote_average: number
  vote_count: number

  // append_to_response
  credits: TmdbCredits
  external_ids: TmdbExternalIds
  'watch/providers': TmdbWatchProvidersResponse
}

// ─── Respostas paginadas ──────────────────────────────────────────────────────

export interface TmdbListResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export type TmdbMovieListResponse = TmdbListResponse<TmdbMovie>

// ─── Endpoint /genre/movie/list ───────────────────────────────────────────────

export interface TmdbGenreListResponse {
  genres: TmdbGenre[]
}
