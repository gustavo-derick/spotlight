// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2'

// ─── Config ───────────────────────────────────────────────────────────────────

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'
const RAPIDAPI_HOST = 'movies-ratings2.p.rapidapi.com'
const RETRY_DELAYS = [1000, 3000, 9000] as const
const CONCURRENCY = 5
const CAST_LIMIT = 20

// ─── Types (inline — edge functions não importam de src/) ─────────────────────

type RatingSource = 'imdb' | 'rotten_tomatoes' | 'letterboxd'
type StreamingType = 'flatrate' | 'rent' | 'buy' | 'ads'

interface TmdbListPage {
  results: Array<{ id: number }>
  total_pages: number
}

interface TmdbCastMember {
  id: number
  name: string
  character: string
  order: number
  profile_path: string | null
  known_for_department: string
}

interface TmdbCrewMember {
  id: number
  name: string
  job: string
  profile_path: string | null
  known_for_department: string
}

interface TmdbWatchProvider {
  provider_name: string
  logo_path: string
}

interface TmdbWatchProvidersByType {
  link?: string
  flatrate?: TmdbWatchProvider[]
  rent?: TmdbWatchProvider[]
  buy?: TmdbWatchProvider[]
  ads?: TmdbWatchProvider[]
}

interface TmdbMovieDetails {
  id: number
  title: string
  original_title: string
  original_language: string
  overview: string
  release_date: string
  runtime: number | null
  poster_path: string | null
  backdrop_path: string | null
  genres: Array<{ id: number }>
  credits: { cast: TmdbCastMember[]; crew: TmdbCrewMember[] }
  external_ids: { imdb_id: string | null }
  'watch/providers': { results: Record<string, TmdbWatchProvidersByType> }
}

interface RatingsApiResponse {
  ratings?: {
    imdb?: { score: number; reviewsCount?: number; url?: string }
    rotten_tomatoes?: { tomatometer?: number; tomatometerReviewsCount?: number; url?: string }
    letterboxd?: { score?: number; url?: string }
  }
}

// ─── Retry com backoff exponencial ───────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < RETRY_DELAYS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
      }
    }
  }
  throw lastError
}

// ─── Helpers TMDB ─────────────────────────────────────────────────────────────

function buildImageUrl(path: string | null, size: string): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = Deno.env.get('TMDB_API_KEY')!
  const url = new URL(TMDB_BASE + path)
  url.searchParams.set('language', 'pt-BR')

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  // Suporte tanto a v3 API Key (hex) quanto v4 Read Access Token (JWT)
  if (apiKey.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${apiKey}`
  } else {
    url.searchParams.set('api_key', apiKey)
  }

  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`TMDB ${res.status} ${path}`)
  return res.json() as Promise<T>
}

/**
 * Coleta todos os tmdb_ids únicos dos 4 endpoints de lista.
 * best-effort: falhas em páginas individuais são ignoradas.
 */
async function collectTmdbIds(): Promise<number[]> {
  const sources: Array<{ path: string; pages: number; extra: Record<string, string> }> = [
    { path: '/movie/now_playing', pages: 3, extra: { region: 'BR' } },
    { path: '/movie/popular', pages: 3, extra: { region: 'BR' } },
    { path: '/movie/upcoming', pages: 3, extra: { region: 'BR' } },
    { path: '/trending/movie/week', pages: 2, extra: {} },
  ]

  const ids = new Set<number>()

  for (const { path, pages, extra } of sources) {
    for (let page = 1; page <= pages; page++) {
      try {
        const data = await withRetry(() =>
          tmdbGet<TmdbListPage>(path, { page: String(page), ...extra }),
        )
        for (const item of data.results) ids.add(item.id)
        if (page >= data.total_pages) break
      } catch (err) {
        console.warn(
          `TMDB list error ${path} page ${page}:`,
          err instanceof Error ? err.message : err,
        )
      }
    }
  }

  return [...ids]
}

async function fetchMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
  return withRetry(() =>
    tmdbGet<TmdbMovieDetails>(`/movie/${tmdbId}`, {
      append_to_response: 'credits,external_ids,watch/providers',
      region: 'BR',
    }),
  )
}

// ─── Helper RapidAPI ──────────────────────────────────────────────────────────

async function fetchRatings(imdbId: string): Promise<RatingsApiResponse> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY')!
  return withRetry(async () => {
    const res = await fetch(`https://${RAPIDAPI_HOST}/ratings?id=${imdbId}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': apiKey,
      },
    })
    // 404 significa que não tem ratings — não é erro de sync
    if (res.status === 404) return {}
    if (!res.ok) throw new Error(`RapidAPI ${res.status} for ${imdbId}`)
    return res.json() as Promise<RatingsApiResponse>
  })
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapRatings(
  data: RatingsApiResponse,
  movieId: string,
  imdbId: string,
): Array<{
  movie_id: string
  source: RatingSource
  score: number
  score_max: number
  votes: number | null
  url: string | null
}> {
  const rows = []
  const r = data.ratings

  if (r?.imdb?.score != null) {
    rows.push({
      movie_id: movieId,
      source: 'imdb' as RatingSource,
      score: r.imdb.score,
      score_max: 10,
      votes: r.imdb.reviewsCount ?? null,
      url: r.imdb.url ?? `https://www.imdb.com/title/${imdbId}/`,
    })
  }
  if (r?.rotten_tomatoes?.tomatometer != null) {
    rows.push({
      movie_id: movieId,
      source: 'rotten_tomatoes' as RatingSource,
      score: r.rotten_tomatoes.tomatometer,
      score_max: 100,
      votes: r.rotten_tomatoes.tomatometerReviewsCount ?? null,
      url: r.rotten_tomatoes.url ?? null,
    })
  }
  if (r?.letterboxd?.score != null) {
    rows.push({
      movie_id: movieId,
      source: 'letterboxd' as RatingSource,
      score: r.letterboxd.score,
      score_max: 5,
      votes: null,
      url: r.letterboxd.url ?? null,
    })
  }

  return rows
}

// ─── Processamento de um filme ────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createClient>

async function processMovie(
  supabase: SupabaseClient,
  tmdbId: number,
): Promise<'processed' | 'skipped' | 'error'> {
  let details: TmdbMovieDetails
  try {
    details = await fetchMovieDetails(tmdbId)
  } catch (err) {
    console.error(
      `fetchMovieDetails error tmdb_id=${tmdbId}:`,
      err instanceof Error ? err.message : err,
    )
    return 'error'
  }

  const imdbId = details.external_ids.imdb_id
  if (!imdbId || !/^tt\d{7,}$/.test(imdbId)) return 'skipped'

  // Upsert movies
  const { data: movieRow, error: movieErr } = await supabase
    .from('movies')
    .upsert(
      {
        tmdb_id: details.id,
        imdb_id: imdbId,
        title_pt: details.title,
        title_original: details.original_title,
        original_language: details.original_language,
        overview_pt: details.overview || null,
        release_date: details.release_date || null,
        runtime: details.runtime ?? null,
        poster_url: buildImageUrl(details.poster_path, 'w500'),
        backdrop_url: buildImageUrl(details.backdrop_path, 'original'),
        genres: details.genres.map((g) => g.id),
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'tmdb_id' },
    )
    .select('id')
    .single()

  if (movieErr || !movieRow) {
    console.error(`movies upsert error tmdb_id=${tmdbId}:`, movieErr?.message)
    return 'error'
  }

  const movieId = (movieRow as any).id as string

  // Upsert elenco (top CAST_LIMIT por order)
  const topCast = details.credits.cast.sort((a, b) => a.order - b.order).slice(0, CAST_LIMIT)

  if (topCast.length > 0) {
    const { data: castPeople } = await supabase
      .from('people')
      .upsert(
        topCast.map((m) => ({
          tmdb_id: m.id,
          name: m.name,
          profile_url: buildImageUrl(m.profile_path, 'w185'),
          known_for: m.known_for_department,
        })),
        { onConflict: 'tmdb_id' },
      )
      .select('id, tmdb_id')

    if (castPeople) {
      const personByTmdb = Object.fromEntries(
        (castPeople as any[]).map((p) => [p.tmdb_id as number, p.id as string]),
      )
      const castRows = topCast
        .filter((m) => personByTmdb[m.id])
        .map((m) => ({
          movie_id: movieId,
          person_id: personByTmdb[m.id],
          character: m.character || null,
          order: m.order,
        }))
      if (castRows.length > 0) {
        await supabase.from('movie_cast').upsert(castRows, { onConflict: 'movie_id,person_id' })
      }
    }
  }

  // Upsert equipe técnica (diretores e roteiristas)
  const relevantCrew = details.credits.crew.filter(
    (m) => m.job === 'Director' || m.job === 'Screenplay' || m.job === 'Writer',
  )

  if (relevantCrew.length > 0) {
    const { data: crewPeople } = await supabase
      .from('people')
      .upsert(
        relevantCrew.map((m) => ({
          tmdb_id: m.id,
          name: m.name,
          profile_url: buildImageUrl(m.profile_path, 'w185'),
          known_for: m.known_for_department,
        })),
        { onConflict: 'tmdb_id' },
      )
      .select('id, tmdb_id')

    if (crewPeople) {
      const personByTmdb = Object.fromEntries(
        (crewPeople as any[]).map((p) => [p.tmdb_id as number, p.id as string]),
      )
      const crewRows = relevantCrew
        .filter((m) => personByTmdb[m.id])
        .map((m) => ({
          movie_id: movieId,
          person_id: personByTmdb[m.id],
          job: m.job,
        }))
      if (crewRows.length > 0) {
        await supabase.from('movie_crew').upsert(crewRows, { onConflict: 'movie_id,person_id,job' })
      }
    }
  }

  // Upsert streaming BR
  const brProviders = details['watch/providers'].results['BR']
  if (brProviders) {
    const deepLink = brProviders.link ?? null
    const streamingRows: Array<{
      movie_id: string
      provider_name: string
      provider_logo_url: string
      type: StreamingType
      region: string
      link: string | null
    }> = []

    for (const type of ['flatrate', 'rent', 'buy', 'ads'] as StreamingType[]) {
      for (const provider of brProviders[type] ?? []) {
        streamingRows.push({
          movie_id: movieId,
          provider_name: provider.provider_name,
          provider_logo_url: buildImageUrl(provider.logo_path, 'original') ?? '',
          type,
          region: 'BR',
          link: deepLink,
        })
      }
    }

    if (streamingRows.length > 0) {
      await supabase
        .from('movie_streaming')
        .upsert(streamingRows, { onConflict: 'movie_id,provider_name,type,region' })
    }
  }

  // Ratings via RapidAPI (best-effort — não falha o sync se der erro)
  try {
    const ratingsData = await fetchRatings(imdbId)
    const ratingRows = mapRatings(ratingsData, movieId, imdbId)
    if (ratingRows.length > 0) {
      await supabase.from('movie_ratings').upsert(ratingRows, { onConflict: 'movie_id,source' })
    }
  } catch (err) {
    console.warn(`ratings error imdb_id=${imdbId}:`, err instanceof Error ? err.message : err)
  }

  return 'processed'
}

// ─── Sync principal ───────────────────────────────────────────────────────────

async function runSync(supabase: SupabaseClient): Promise<{
  processed: number
  skipped: number
  errors: number
}> {
  const tmdbIds = await collectTmdbIds()

  let processed = 0
  let skipped = 0
  let errors = 0

  // Processa em lotes de CONCURRENCY para não sobrecarregar as APIs
  for (let i = 0; i < tmdbIds.length; i += CONCURRENCY) {
    const batch = tmdbIds.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(batch.map((id) => processMovie(supabase, id)))
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value === 'processed') processed++
        else if (result.value === 'skipped') skipped++
        else errors++
      } else {
        errors++
      }
    }
  }

  return { processed, skipped, errors }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

Deno.cron('sync-movies-cron', '0 6 * * *', async () => {
  console.log('Iniciando sync via Deno.cron...')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: logRow } = await supabase
    .from('sync_logs')
    .insert({ function_name: 'sync-movies (cron)', status: 'started' })
    .select('id')
    .single()

  const logId = (logRow as any)?.id as string | undefined

  try {
    const { processed, skipped, errors } = await runSync(supabase)

    if (logId) {
      await supabase
        .from('sync_logs')
        .update({
          status: errors === 0 ? 'success' : 'error',
          finished_at: new Date().toISOString(),
          items_processed: processed,
          error_message: errors > 0 ? `${errors} filmes com erro, ${skipped} pulados` : null,
        })
        .eq('id', logId)
    }
  } catch (err) {
    console.error('Erro no cron:', err)
    if (logId) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'error',
          finished_at: new Date().toISOString(),
          error_message: err instanceof Error ? err.message : String(err),
        })
        .eq('id', logId)
    }
  }
})

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: logRow } = await supabase
    .from('sync_logs')
    .insert({ function_name: 'sync-movies', status: 'started' })
    .select('id')
    .single()

  const logId = (logRow as any)?.id as string | undefined
  const startedAt = Date.now()

  try {
    const { processed, skipped, errors } = await runSync(supabase)

    if (logId) {
      await supabase
        .from('sync_logs')
        .update({
          status: errors === 0 ? 'success' : 'error',
          finished_at: new Date().toISOString(),
          items_processed: processed,
          error_message: errors > 0 ? `${errors} filmes com erro, ${skipped} pulados` : null,
        })
        .eq('id', logId)
    }

    return new Response(
      JSON.stringify({ ok: true, processed, skipped, errors, ms: Date.now() - startedAt }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    if (logId) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'error',
          finished_at: new Date().toISOString(),
          error_message: message,
        })
        .eq('id', logId)
    }

    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
