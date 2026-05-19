import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { MovieRow } from '@/components/movie/movie-row'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'
import { TrailerDialog } from '@/components/movie/trailer-dialog'
import { fetchMovieTrailer } from '@/lib/tmdb/client'

export const revalidate = 3600

async function HeroTrailerSection({ tmdbId, title }: { tmdbId: number; title: string }) {
  try {
    const trailer = await fetchMovieTrailer(tmdbId)
    if (!trailer) return null
    return (
      <TrailerDialog
        trailer={trailer}
        movieTitle={title}
        size="lg"
        className="bg-white px-8 text-black hover:bg-zinc-200"
      />
    )
  } catch {
    return null
  }
}

export default async function HomePage() {
  const supabase = await createClient()

  // Configuração comum para selects
  const baseSelect =
    'id, title_pt, title_original, poster_url, release_date, movie_ratings(source, score)'

  // TMDB ID do filme pinado como hero: A Cantiga dos Pássaros e das Serpentes
  const PINNED_HERO_TMDB_ID = 695721

  // Executar buscas em paralelo para performance
  const [
    pinnedHeroResult,
    { data: heroMovieResult },
    { data: latestMoviesResult },
    { data: popularMoviesResult },
    { data: actionMoviesResult },
    { data: sciFiMoviesResult },
    { data: horrorMoviesResult },
    { data: comedyMoviesResult },
    { data: romanceMoviesResult },
  ] = await Promise.all([
    // Filme pinado como hero
    supabase
      .from('movies')
      .select('id, tmdb_id, title_pt, title_original, overview_pt, backdrop_url, release_date')
      .eq('tmdb_id', PINNED_HERO_TMDB_ID)
      .not('backdrop_url', 'is', null)
      .maybeSingle(),

    // Hero fallback: filme mais recente com backdrop
    supabase
      .from('movies')
      .select('id, tmdb_id, title_pt, title_original, overview_pt, backdrop_url, release_date')
      .order('release_date', { ascending: false })
      .not('backdrop_url', 'is', null)
      .limit(1)
      .single(),

    // Últimos Lançamentos
    supabase
      .from('movies')
      .select(baseSelect)
      .order('release_date', { ascending: false })
      .not('poster_url', 'is', null)
      .limit(15),

    // Populares
    supabase.from('movies').select(baseSelect).not('poster_url', 'is', null).limit(15),

    // Ação & Aventura (28, 12)
    supabase
      .from('movies')
      .select(baseSelect)
      .overlaps('genres', [28, 12])
      .not('poster_url', 'is', null)
      .limit(15),

    // Ficção Científica (878)
    supabase
      .from('movies')
      .select(baseSelect)
      .contains('genres', [878])
      .not('poster_url', 'is', null)
      .limit(15),

    // Terror & Suspense (27, 53)
    supabase
      .from('movies')
      .select(baseSelect)
      .overlaps('genres', [27, 53])
      .not('poster_url', 'is', null)
      .limit(15),

    // Comédias (35)
    supabase
      .from('movies')
      .select(baseSelect)
      .contains('genres', [35])
      .not('poster_url', 'is', null)
      .limit(15),

    // Romance (10749)
    supabase
      .from('movies')
      .select(baseSelect)
      .contains('genres', [10749])
      .not('poster_url', 'is', null)
      .limit(15),
  ])

  const heroMovie = (pinnedHeroResult.data ?? heroMovieResult) as any

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const heroReleaseDate = heroMovie?.release_date
    ? new Date(heroMovie.release_date + 'T00:00:00')
    : null
  // "Em breve" se for o filme pinado OU se a data de lançamento ainda não chegou
  const isHeroComingSoon =
    Boolean(pinnedHeroResult.data) || (heroReleaseDate ? heroReleaseDate > today : false)

  return (
    <div className="flex min-h-screen flex-col pb-16">
      {/* Hero Section */}
      <section className="relative flex h-[55vh] max-h-[800px] min-h-[360px] w-full items-end md:h-[70vh] md:min-h-[500px]">
        {heroMovie?.backdrop_url ? (
          <>
            <div className="absolute inset-0 z-0">
              <Image
                src={heroMovie.backdrop_url}
                alt={heroMovie.title_pt || heroMovie.title_original}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            </div>
            {/* Gradient Overlay */}
            <div className="from-background via-background/80 absolute inset-0 z-10 bg-gradient-to-t to-transparent" />
            <div className="from-background via-background/50 absolute inset-0 z-10 bg-gradient-to-r to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 z-0 bg-zinc-900" />
        )}

        <div className="relative z-20 container mx-auto px-4 pb-12 md:px-8 md:pb-24">
          <div className="max-w-2xl space-y-4">
            {isHeroComingSoon && (
              <div>
                <span className="inline-flex items-center rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold tracking-widest text-white uppercase shadow-lg">
                  Em breve
                </span>
              </div>
            )}
            <h1 className="text-4xl font-bold tracking-tighter text-white drop-shadow-md md:text-6xl">
              {heroMovie?.title_pt || heroMovie?.title_original || 'Bem-vindo ao Spotlight'}
            </h1>

            <p className="line-clamp-3 max-w-xl text-sm text-zinc-300 drop-shadow md:line-clamp-4 md:text-base">
              {heroMovie?.overview_pt ||
                'Sua plataforma definitiva para descobrir filmes, ver onde assistir e organizar sua watchlist de forma premium e sem interrupções.'}
            </p>

            <div className="flex items-center gap-3 pt-4">
              {heroMovie ? (
                <>
                  {heroMovie.tmdb_id && (
                    <Suspense fallback={null}>
                      <HeroTrailerSection
                        tmdbId={heroMovie.tmdb_id}
                        title={heroMovie.title_pt || heroMovie.title_original}
                      />
                    </Suspense>
                  )}
                  <Link href={`/filme/${heroMovie.id}`}>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="rounded-full border border-zinc-700 bg-zinc-800/80 px-8 font-semibold text-white backdrop-blur-md hover:bg-zinc-700"
                    >
                      <Info className="mr-2 h-5 w-5" />
                      Mais Informações
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/lancamentos">
                  <Button
                    size="lg"
                    className="rounded-full bg-white px-8 font-semibold text-black hover:bg-zinc-200"
                  >
                    Explorar Catálogo
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Rows */}
      <div className="relative z-30 -mt-8 flex flex-col gap-2">
        <MovieRow
          title="Lançamentos"
          movies={(latestMoviesResult as any) || []}
          viewAllLink="/lancamentos"
        />

        <MovieRow
          title="Populares"
          movies={(popularMoviesResult as any) || []}
          viewAllLink="/populares"
        />

        <MovieRow
          title="Ação e Aventura"
          movies={(actionMoviesResult as any) || []}
          viewAllLink="/genero/acao"
        />

        <MovieRow
          title="Ficção Científica"
          movies={(sciFiMoviesResult as any) || []}
          viewAllLink="/genero/ficcao-cientifica"
        />

        <MovieRow
          title="Terror e Suspense"
          movies={(horrorMoviesResult as any) || []}
          viewAllLink="/genero/terror"
        />

        <MovieRow
          title="Comédias"
          movies={(comedyMoviesResult as any) || []}
          viewAllLink="/genero/comedia"
        />

        <MovieRow
          title="Romance"
          movies={(romanceMoviesResult as any) || []}
          viewAllLink="/genero/romance"
        />
      </div>
    </div>
  )
}
