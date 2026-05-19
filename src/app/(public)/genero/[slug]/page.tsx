import { createClient } from '@/lib/supabase/server'
import { MovieGrid } from '@/components/movie/movie-grid'
import { notFound } from 'next/navigation'
import { GENRE_SLUGS, GENRE_MAP, GENRE_COLORS, GENRE_EMOJIS } from '@/config/genres'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const genreId = GENRE_SLUGS[slug]
  if (!genreId) return { title: 'Gênero | Spotlight' }
  const name = GENRE_MAP[genreId]
  return {
    title: `${name} | Spotlight`,
    description: `Explore todos os filmes de ${name} no Spotlight.`,
  }
}

export default async function GeneroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const genreId = GENRE_SLUGS[slug]

  if (!genreId) notFound()

  const genreName = GENRE_MAP[genreId]
  const gradient = GENRE_COLORS[genreId] ?? 'from-zinc-700 to-zinc-900'
  const emoji = GENRE_EMOJIS[genreId] ?? '🎬'

  const supabase = await createClient()

  const { data: moviesRaw } = await supabase
    .from('movies')
    .select('id, title_pt, title_original, poster_url, release_date, movie_ratings(source, score)')
    .overlaps('genres', [genreId])
    .not('poster_url', 'is', null)
    .order('release_date', { ascending: false })
    .limit(200)

  const movies = (moviesRaw ?? []) as any[]

  return (
    <main className="min-h-screen">
      {/* Hero Header */}
      <section className="relative overflow-hidden px-4 pt-32 pb-16">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-25`} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90" />

        <div className="relative z-10 container mx-auto max-w-7xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-sm font-medium text-zinc-400 backdrop-blur-md transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          <div className="flex items-center gap-5">
            <span className="text-6xl">{emoji}</span>
            <div>
              <p className="mb-1 text-sm font-semibold tracking-widest text-zinc-400 uppercase">
                Gênero
              </p>
              <h1 className="text-5xl font-extrabold tracking-tight text-white">{genreName}</h1>
              <p className="mt-1 text-zinc-400">{movies.length} filmes encontrados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="container mx-auto max-w-7xl px-4 py-10">
        {movies.length > 0 ? (
          <MovieGrid movies={movies} />
        ) : (
          <div className="py-24 text-center">
            <span className="text-5xl">{emoji}</span>
            <h2 className="mt-4 mb-2 text-2xl font-bold text-white">Nenhum filme encontrado</h2>
            <p className="text-zinc-400">Estamos sincronizando mais filmes. Volte em breve!</p>
          </div>
        )}
      </section>
    </main>
  )
}
