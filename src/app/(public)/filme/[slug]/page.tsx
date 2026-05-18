import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Clock, Calendar, Clapperboard, MonitorPlay, Heart, BookmarkPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { ScrapedStreaming } from '@/components/movie/scraped-streaming'
import { ScrapedRatings } from '@/components/movie/scraped-ratings'
import { MovieReviews } from '@/components/movie/movie-reviews'

import { UserActions } from '@/components/movie/user-actions'
import { StarRating } from '@/components/movie/star-rating'

export const revalidate = 3600

export default async function FilmePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Buscar os dados do filme, junto com relacionamentos via foreign key
  // Usamos aliases implícitos para o join com people através das foreign keys
  const { data: movieResult, error } = await supabase
    .from('movies')
    .select(
      `
      *,
      movie_ratings(source, score),
      movie_streaming(provider_name, provider_logo_url, type),
      movie_cast(character, person_id, people(name, profile_url)),
      movie_crew(job, person_id, people(name))
    `,
    )
    .eq('id', slug)
    .single()

  if (error || !movieResult) {
    console.error('Erro ao buscar filme:', error)
    notFound()
  }

  const movie = movieResult as any

  // Buscar dados do usuário logado
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let isFavorite = false
  let inWatchlist = false

  if (user) {
    const [favRes, watchRes] = await Promise.all([
      supabase
        .from('user_favorites')
        .select('movie_id')
        .match({ user_id: user.id, movie_id: movie.id })
        .maybeSingle(),
      supabase
        .from('user_watchlist')
        .select('movie_id')
        .match({ user_id: user.id, movie_id: movie.id })
        .maybeSingle(),
    ])
    isFavorite = !!favRes.data
    inWatchlist = !!watchRes.data
  }

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const formattedDate = movie.release_date
    ? new Date(movie.release_date).toLocaleDateString('pt-BR')
    : 'Data desconhecida'

  let runtimeStr = 'Duração desconhecida'
  if (movie.runtime && movie.runtime > 0) {
    const hours = Math.floor(movie.runtime / 60)
    const mins = movie.runtime % 60
    runtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const director = movie.movie_crew?.find((c: any) => c.job === 'Director')

  // Separar streamings (priorizar assinatura/flatrate) e deduplicar
  const rawFlatrate = movie.movie_streaming?.filter((s: any) => s.type === 'flatrate') || []
  const uniqueProviders = new Map()

  for (const provider of rawFlatrate) {
    let coreName = provider.provider_name.toLowerCase()

    // Normalizar nomes base para evitar duplicações (ex: "Netflix" vs "Netflix Standard with Ads")
    if (coreName.includes('netflix')) coreName = 'netflix'
    else if (coreName.includes('prime video')) coreName = 'prime video'
    else if (coreName.includes('telecine')) coreName = 'telecine'
    else if (coreName.includes('max')) coreName = 'max'
    else if (coreName.includes('disney')) coreName = 'disney'
    else if (coreName.includes('apple')) coreName = 'apple'
    else if (coreName.includes('paramount')) coreName = 'paramount'
    else if (coreName.includes('claro')) coreName = 'claro'
    else if (coreName.includes('globoplay')) coreName = 'globoplay'

    // Guardar apenas a primeira ocorrência (que geralmente é a principal)
    if (!uniqueProviders.has(coreName)) {
      uniqueProviders.set(coreName, provider)
    }
  }

  const streamingFlatrate = Array.from(uniqueProviders.values())

  // Pegar avaliações
  const imdb = movie.movie_ratings?.find((r: any) => r.source === 'imdb')
  const rt = movie.movie_ratings?.find((r: any) => r.source === 'rotten_tomatoes')
  const lb = movie.movie_ratings?.find((r: any) => r.source === 'letterboxd')

  // Pegar estatísticas de avaliações dos usuários (média e contagem)
  const { data: ratingStats } = await (supabase as any).rpc('get_movie_rating_stats', {
    p_movie_id: movie.id,
  })
  const stats = (
    ratingStats as
      | { avg_rating: number | string | null; rating_count: number | string | null }[]
      | null
  )?.[0]
  const initialAvg = stats?.avg_rating == null ? null : Number(stats.avg_rating)
  const initialCount = stats?.rating_count == null ? 0 : Number(stats.rating_count)

  // Pegar rating do usuário logado, se houver
  let userRating: number | null = null
  if (user) {
    const { data: userRatingData } = await (supabase as any).rpc('get_user_movie_rating', {
      p_user_id: user.id,
      p_movie_id: movie.id,
    })
    if (typeof userRatingData === 'number') {
      userRating = userRatingData
    }
  }

  // Top elenco (máximo 6)
  const topCast = movie.movie_cast?.slice(0, 6) || []

  return (
    <main className="flex min-h-screen flex-col pb-16">
      {/* Hero Section */}
      <section className="relative flex h-[50vh] min-h-[400px] w-full items-end">
        {movie.backdrop_url ? (
          <>
            <div className="absolute inset-0 z-0">
              <Image
                src={movie.backdrop_url}
                alt={movie.title_pt || movie.title_original}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            </div>
            {/* Gradient Overlay duplo para garantir legibilidade do texto */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/50 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 z-0 bg-zinc-900" />
        )}

        <div className="relative z-20 container mx-auto flex flex-col items-end gap-6 px-4 pb-8 md:flex-row md:items-start md:gap-8 md:px-8">
          {/* Poster Desktop (visível apenas md+) */}
          <div className="relative -mt-32 hidden aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-xl border-2 border-zinc-800 shadow-2xl md:block lg:w-64">
            {movie.poster_url ? (
              <Image
                src={movie.poster_url}
                alt={movie.title_pt || movie.title_original}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 192px, 256px"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                <Clapperboard className="h-16 w-16 text-zinc-600" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md md:text-5xl">
              {movie.title_pt || movie.title_original}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300 md:text-base">
              {releaseYear && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <span>{releaseYear}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span>{runtimeStr}</span>
              </div>

              {director && director.people && (
                <div className="hidden items-center gap-1.5 border-l border-zinc-700 pl-4 sm:flex">
                  <span className="text-zinc-400">Direção:</span>
                  <span className="font-medium text-white">{director.people.name}</span>
                </div>
              )}
            </div>

            {/* Avaliações em destaque */}
            {imdb || rt || lb ? (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {imdb && (
                  <div
                    className="flex items-center gap-2 rounded-lg bg-[#f5c518] px-3 py-1.5 text-black"
                    title="IMDb"
                  >
                    <span className="font-black">IMDb</span>
                    <span className="font-semibold">
                      {imdb.score.toFixed(1)}
                      <span className="text-sm font-normal opacity-70">/10</span>
                    </span>
                  </div>
                )}
                {rt && (
                  <div
                    className="flex items-center gap-2 rounded-lg bg-[#fa320a] px-3 py-1.5 text-white"
                    title="Rotten Tomatoes"
                  >
                    <span className="font-bold">RT</span>
                    <span className="font-semibold">{rt.score}%</span>
                  </div>
                )}
                {lb && (
                  <div
                    className="flex items-center gap-2 rounded-lg border border-[#40bcf4]/30 bg-[#2c3440] px-3 py-1.5 text-[#00e054]"
                    title="Letterboxd"
                  >
                    <span className="font-bold">LB</span>
                    <span className="font-semibold">
                      {lb.score.toFixed(1)}
                      <span className="text-sm font-normal opacity-70">/5</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <ScrapedRatings imdbId={movie.imdb_id} />
            )}

            {/* Ações (Favoritos/Watchlist) */}
            <div className="flex flex-col gap-4">
              <div>
                <StarRating
                  movieId={movie.id}
                  initialAvg={initialAvg}
                  initialCount={initialCount}
                  initialUserRating={userRating}
                  isAuthenticated={!!user}
                />
              </div>

              <UserActions
                movieId={movie.id}
                initialFavorite={isFavorite}
                initialWatchlist={inWatchlist}
                isAuthenticated={!!user}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto mt-8 grid grid-cols-1 gap-12 px-4 md:mt-12 md:px-8 lg:grid-cols-[1fr_300px]">
        {/* Main Content (Left) */}
        <div className="space-y-12">
          {/* Poster Mobile */}
          <div className="relative z-20 mx-auto -mt-24 aspect-[2/3] w-1/2 max-w-[200px] overflow-hidden rounded-xl border border-zinc-800 shadow-xl md:hidden">
            {movie.poster_url ? (
              <Image
                src={movie.poster_url}
                alt={movie.title_pt || movie.title_original}
                fill
                className="object-cover"
                sizes="50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                <Clapperboard className="h-12 w-12 text-zinc-600" />
              </div>
            )}
          </div>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">Sinopse</h2>
            <p className="text-lg leading-relaxed text-zinc-300">
              {movie.overview_pt || 'Nenhuma sinopse disponível em português.'}
            </p>
          </section>

          {topCast.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-bold text-white">Elenco Principal</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {topCast.map((cast: any, i: number) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="relative aspect-square w-full overflow-hidden rounded-full border border-zinc-800 bg-zinc-800">
                      {cast.people?.profile_url ? (
                        <Image
                          src={cast.people.profile_url}
                          alt={cast.people?.name || 'Ator'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 15vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-600">
                          {cast.people?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="line-clamp-1 text-sm font-medium text-white">
                        {cast.people?.name}
                      </p>
                      <p className="line-clamp-1 text-xs text-zinc-500">{cast.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <MovieReviews tmdbId={movie.tmdb_id} />
        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-8">
          {streamingFlatrate.length > 0 ? (
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                <MonitorPlay className="h-5 w-5 text-indigo-400" />
                Onde Assistir
              </h3>
              <div className="flex flex-wrap gap-3">
                {streamingFlatrate.map((provider: any, i: number) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2"
                    title={provider.provider_name}
                  >
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-zinc-700 shadow-md">
                      <Image
                        src={provider.provider_logo_url}
                        alt={provider.provider_name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <span className="line-clamp-2 max-w-[60px] text-center text-[10px] leading-tight font-medium text-zinc-400">
                      {provider.provider_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ScrapedStreaming title={movie.title_original || movie.title_pt} />
          )}

          <div className="space-y-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
            <h3 className="mb-2 text-lg font-bold text-white">Informações</h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="mb-0.5 block font-medium text-zinc-500">Título Original</span>
                <span className="text-zinc-200">{movie.title_original}</span>
              </div>

              <div>
                <span className="mb-0.5 block font-medium text-zinc-500">Lançamento</span>
                <span className="text-zinc-200">{formattedDate}</span>
              </div>

              <div>
                <span className="mb-0.5 block font-medium text-zinc-500">Idioma Original</span>
                <span className="text-zinc-200 uppercase">{movie.original_language}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
