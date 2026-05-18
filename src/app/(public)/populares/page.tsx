import { createClient } from '@/lib/supabase/server'
import { MovieCard } from '@/components/movie/movie-card'
import { TrendingUp } from 'lucide-react'

export const revalidate = 3600

export const metadata = {
  title: 'Populares | Spotlight',
  description: 'Os filmes mais populares e bem avaliados do momento.',
}

export default async function PopularesPage() {
  const supabase = await createClient()

  // Busca todos os filmes com rating IMDb existente, para ordenar
  const { data: moviesRaw } = await supabase
    .from('movies')
    .select(
      'id, title_pt, title_original, poster_url, release_date, movie_ratings(source, score, votes)',
    )
    .not('poster_url', 'is', null)
    .limit(200)

  // Ordena localmente: prioriza filmes com mais votos IMDb (indicador de popularidade)
  const movies = ((moviesRaw ?? []) as any[])
    .sort((a, b) => {
      const aImdb = a.movie_ratings?.find((r: any) => r.source === 'imdb')
      const bImdb = b.movie_ratings?.find((r: any) => r.source === 'imdb')
      const aVotes = aImdb?.votes ?? 0
      const bVotes = bImdb?.votes ?? 0
      return bVotes - aVotes
    })
    .slice(0, 100)

  return (
    <main className="container mx-auto mt-20 px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-2 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-rose-400 to-orange-600" />
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Populares</h1>
        </div>
        <p className="ml-4 text-zinc-400">
          Os filmes mais assistidos e bem avaliados do nosso catálogo.
        </p>
      </div>

      {movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {movies.map((movie: any, i: number) => (
            <MovieCard key={movie.id} movie={movie} priority={i < 6} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <TrendingUp className="mb-4 h-16 w-16 text-zinc-700" />
          <h2 className="mb-2 text-2xl font-bold text-white">Carregando populares...</h2>
          <p className="text-zinc-400">Os dados estão sendo sincronizados. Volte em breve!</p>
        </div>
      )}
    </main>
  )
}
