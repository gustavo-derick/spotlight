import type {
  MovieInsert,
  MovieStreamingInsert,
  PersonInsert,
  StreamingType,
} from '@/types/database'
import { buildImageUrl, TMDB_BACKDROP_SIZE, TMDB_POSTER_SIZE, TMDB_PROFILE_SIZE } from './client'
import type { TmdbCastMember, TmdbCrewMember, TmdbMovieDetails, TmdbWatchProvider } from './types'

// ─── Resultado composto do mapper de filme ─────────────────────────────────────

export interface MappedMovieDetails {
  movie: MovieInsert
  cast: Array<{ person: PersonInsert; character: string | null; order: number }>
  crew: Array<{ person: PersonInsert; job: string }>
  streamingBR: Omit<MovieStreamingInsert, 'movie_id'>[]
}

/**
 * Converte a resposta completa da TMDB para os shapes de inserção do banco.
 *
 * Exige que external_ids.imdb_id esteja presente — se ausente, lança para que o
 * chamador decida se pula o filme ou registra no sync_logs.
 *
 * @param details  Resposta de /movie/{id}?append_to_response=credits,external_ids,watch/providers
 * @throws Se imdb_id estiver ausente ou com formato inválido
 */
export function mapMovieDetails(details: TmdbMovieDetails): MappedMovieDetails {
  const imdbId = details.external_ids.imdb_id

  if (!imdbId) {
    throw new Error(
      `TMDB filme ${details.id} (${details.original_title}) não tem imdb_id — pulando ratings`,
    )
  }

  if (!/^tt\d{7,}$/.test(imdbId)) {
    throw new Error(`TMDB filme ${details.id} tem imdb_id com formato inválido: "${imdbId}"`)
  }

  const movie: MovieInsert = {
    tmdb_id: details.id,
    imdb_id: imdbId,
    title_pt: details.title,
    title_original: details.original_title,
    original_language: details.original_language,
    overview_pt: details.overview || null,
    release_date: details.release_date || null,
    runtime: details.runtime ?? null,
    poster_url: buildImageUrl(details.poster_path, TMDB_POSTER_SIZE),
    backdrop_url: buildImageUrl(details.backdrop_path, TMDB_BACKDROP_SIZE),
    genres: details.genres.map((g) => g.id),
    last_synced_at: new Date().toISOString(),
  }

  const cast = details.credits.cast.map((member) => ({
    person: mapCastMember(member),
    character: member.character || null,
    order: member.order,
  }))

  // Apenas diretores e roteiristas por padrão
  const crew = details.credits.crew
    .filter((m) => m.job === 'Director' || m.job === 'Screenplay' || m.job === 'Writer')
    .map((member) => ({
      person: mapCrewMember(member),
      job: member.job,
    }))

  const streamingBR = mapWatchProvidersBR(details['watch/providers'].results['BR'])

  return { movie, cast, crew, streamingBR }
}

/**
 * Converte um membro do elenco da TMDB para o shape de inserção de people.
 */
export function mapCastMember(member: TmdbCastMember): PersonInsert {
  return {
    tmdb_id: member.id,
    name: member.name,
    profile_url: buildImageUrl(member.profile_path, TMDB_PROFILE_SIZE),
    known_for: member.known_for_department,
  }
}

/**
 * Converte um membro da equipe técnica da TMDB para o shape de inserção de people.
 */
export function mapCrewMember(member: TmdbCrewMember): PersonInsert {
  return {
    tmdb_id: member.id,
    name: member.name,
    profile_url: buildImageUrl(member.profile_path, TMDB_PROFILE_SIZE),
    known_for: member.known_for_department,
  }
}

/**
 * Converte os watch providers BR da TMDB para o shape de inserção de movie_streaming.
 *
 * Retorna array vazio se não houver providers para BR.
 */
export function mapWatchProvidersBR(
  brProviders:
    | {
        flatrate?: TmdbWatchProvider[]
        rent?: TmdbWatchProvider[]
        buy?: TmdbWatchProvider[]
        ads?: TmdbWatchProvider[]
        link?: string
      }
    | undefined,
): Omit<MovieStreamingInsert, 'movie_id'>[] {
  if (!brProviders) return []

  const result: Omit<MovieStreamingInsert, 'movie_id'>[] = []
  const deepLink = brProviders.link ?? null

  const types: StreamingType[] = ['flatrate', 'rent', 'buy', 'ads']
  for (const type of types) {
    const providers = brProviders[type]
    if (!providers) continue

    for (const provider of providers) {
      result.push({
        provider_name: provider.provider_name,
        provider_logo_url: buildImageUrl(provider.logo_path, 'original') ?? '',
        type,
        region: 'BR',
        link: deepLink,
      })
    }
  }

  return result
}
