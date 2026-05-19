import { VIBES } from '@/config/vibes'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MovieGrid } from '@/components/movie/movie-grid'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const vibe = VIBES.find((v) => v.slug === slug)
  if (!vibe) return { title: 'Vibe não encontrada | Spotlight' }
  return {
    title: `${vibe.emoji} ${vibe.name} | Spotlight Vibes`,
    description: vibe.description,
  }
}

export default async function VibePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const vibe = VIBES.find((v) => v.slug === slug)
  if (!vibe) notFound()

  const supabase = await createClient()

  const query = supabase
    .from('movies')
    .select(
      'id, title_pt, title_original, poster_url, release_date, genres, movie_ratings(source, score)',
    )
    .not('poster_url', 'is', null)
    .limit(200)

  // Vibe curada por tmdb_ids — ignora os demais filtros
  if (vibe.filters.tmdb_ids?.length) {
    query.in('tmdb_id', vibe.filters.tmdb_ids)
  } else {
    if (vibe.filters.genre_ids?.length) {
      query.overlaps('genres', vibe.filters.genre_ids)
    }
    if (vibe.filters.year_from) {
      query.gte('release_date', `${vibe.filters.year_from}-01-01`)
    }
    if (vibe.filters.year_to) {
      query.lte('release_date', `${vibe.filters.year_to}-12-31`)
    }
  }

  const { data: moviesData, error } = await query.order('release_date', { ascending: false })

  if (error) {
    console.error('Erro ao buscar filmes da vibe:', error)
  }

  let movies: any[] = moviesData ?? []

  // Filtra por nota mínima IMDb se configurado
  if (vibe.filters.min_imdb_score) {
    movies = movies.filter((m: any) => {
      const imdb = m.movie_ratings?.find((r: any) => r.source === 'imdb')
      return imdb && imdb.score >= vibe.filters.min_imdb_score!
    })
  }

  if (vibe.filters.tmdb_ids?.length) {
    // Preserva a ordem da curadoria
    const order = new Map(vibe.filters.tmdb_ids.map((id, i) => [id, i]))
    movies.sort((a, b) => (order.get(a.tmdb_id) ?? 99) - (order.get(b.tmdb_id) ?? 99))
  } else {
    // Fisher-Yates shuffle para descoberta aleatória
    for (let i = movies.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[movies[i], movies[j]] = [movies[j], movies[i]]
    }
  }

  return (
    <main className="min-h-screen">
      {/* Header da Vibe */}
      <section className={`relative overflow-hidden px-4 pt-32 pb-20`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${vibe.colors} opacity-30`} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90" />

        <div className="relative z-10 container mx-auto max-w-6xl">
          <Link
            href="/vibes"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-sm font-medium text-zinc-400 backdrop-blur-md transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Vibes
          </Link>

          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            <span className="text-7xl drop-shadow-xl filter md:text-8xl">{vibe.emoji}</span>
            <div>
              <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
                {vibe.name}
              </h1>
              <p className="max-w-2xl text-xl font-medium text-zinc-300">{vibe.description}</p>
              <p className="mt-2 text-sm text-zinc-500">{movies.length} filmes selecionados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Filmes */}
      <section className="container mx-auto max-w-7xl px-4 py-12">
        {movies.length > 0 ? (
          <MovieGrid movies={movies} />
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 py-20 text-center">
            <span className="mb-4 block text-5xl">😢</span>
            <h2 className="mb-2 text-2xl font-bold text-white">Sem filmes no momento</h2>
            <p className="text-zinc-400">
              Não encontramos filmes que dão match com essa vibe ainda.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
