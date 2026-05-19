import { createClient } from '@/lib/supabase/server'
import { MovieGrid } from '@/components/movie/movie-grid'
import { Clapperboard } from 'lucide-react'

export const revalidate = 3600

export const metadata = {
  title: 'Lançamentos | Spotlight',
  description: 'Os filmes mais recentes do cinema, direto no Spotlight.',
}

export default async function LancamentosPage() {
  const supabase = await createClient()

  const { data: moviesRaw } = await supabase
    .from('movies')
    .select('id, title_pt, title_original, poster_url, release_date, movie_ratings(source, score)')
    .order('release_date', { ascending: false })
    .not('poster_url', 'is', null)
    .limit(100)

  const movies = (moviesRaw ?? []) as any[]

  return (
    <main className="container mx-auto mt-20 px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-2 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-400 to-indigo-600" />
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Lançamentos</h1>
        </div>
        <p className="ml-4 text-zinc-400">
          Os filmes mais recentes, ordenados por data de lançamento.
        </p>
      </div>

      {movies && movies.length > 0 ? (
        <MovieGrid movies={movies} />
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Clapperboard className="mb-4 h-16 w-16 text-zinc-700" />
          <h2 className="mb-2 text-2xl font-bold text-white">Nenhum lançamento por enquanto</h2>
          <p className="text-zinc-400">Os filmes estão sendo sincronizados. Volte em breve!</p>
        </div>
      )}
    </main>
  )
}
