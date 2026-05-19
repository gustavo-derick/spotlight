import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  searchApiSchema,
  parseGenreIds,
  sanitizeQuery,
  type SearchMovie,
} from '@/lib/search/query-builder'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const parsed = searchApiSchema.safeParse({
    q: sp.get('q') ?? undefined,
    genres: sp.get('genres') ?? undefined,
    yearFrom: sp.get('yearFrom') ?? undefined,
    yearTo: sp.get('yearTo') ?? undefined,
    minImdbScore: sp.get('minImdbScore') ?? undefined,
    limit: sp.get('limit') ?? undefined,
    offset: sp.get('offset') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const params = parsed.data

  // Hash IP antes de usar como chave — nunca logar IPs brutos
  const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const hashedIp = createHash('sha256').update(rawIp).digest('hex').slice(0, 32)

  const admin = createAdminClient()
  const { data: allowed, error: rateError } = await admin.rpc('check_rate_limit', {
    p_key: `search:${hashedIp}`,
    p_max_requests: 30,
    p_window_seconds: 60,
  })

  if (rateError) {
    console.error('[api/search] rate limit check error:', rateError.message)
    // Fail-open: se a função de rate limit falhar, permite a requisição
  } else if (allowed === false) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em breve.' },
      { status: 429 },
    )
  }

  // search_movies_full: função SQL que centraliza todos os filtros em uma única query,
  // incluindo nota mínima IMDb via EXISTS subquery em movie_ratings.
  // Usa admin client: @supabase/ssr não resolve o overload rpc() para funções com
  // todos os args opcionais; a função é SECURITY DEFINER e retorna apenas dados públicos.
  const { data, error } = await admin.rpc('search_movies_full', {
    p_query: sanitizeQuery(params.q) ?? '',
    p_genre_ids: parseGenreIds(params.genres) || undefined,
    p_year_from: params.yearFrom ?? undefined,
    p_year_to: params.yearTo ?? undefined,
    p_min_imdb_score: params.minImdbScore ?? undefined,
    p_limit: params.limit + 1, // +1 para detecção de hasMore
    p_offset: params.offset,
  })

  if (error) {
    console.error('[api/search]', error.message)
    return NextResponse.json({ error: 'Erro ao buscar filmes.' }, { status: 500 })
  }

  // A função retorna ratings como JSONB com campo 'ratings'; remapeamos para movie_ratings
  // para compatibilidade com o componente MovieCard.
  const rows = (data ?? []) as unknown as Array<
    Omit<SearchMovie, 'movie_ratings'> & { ratings: { source: string; score: number }[] }
  >

  const hasMore = rows.length > params.limit
  const sliced = hasMore ? rows.slice(0, params.limit) : rows
  const movies: SearchMovie[] = sliced.map(({ ratings, ...rest }) => ({
    ...rest,
    movie_ratings: ratings,
  }))

  return NextResponse.json({ movies, hasMore })
}
