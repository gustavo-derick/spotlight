import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MovieCard } from '@/components/movie/movie-card'
import { BookmarkPlus } from 'lucide-react'

export const metadata = {
  title: 'Minha Watchlist | Spotlight',
}

export default async function WatchlistPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/entrar')
  }

  // Buscar filmes na watchlist do usuário atual
  const { data: watchlist, error } = await supabase
    .from('user_watchlist')
    .select(
      `
      movie_id,
      created_at,
      watched,
      movies (
        id,
        title_pt,
        title_original,
        poster_url,
        release_date,
        movie_ratings(source, score)
      )
    `,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar watchlist:', error)
  }

  // Filtramos e mapeamos para ter o estado "watched" acessível se quisermos no futuro (ex: componente wrapper)
  const movies =
    watchlist
      ?.map((w: any) => ({
        ...w.movies,
        watched: w.watched,
      }))
      .filter((m: any) => m.id) || []

  return (
    <main className="container mx-auto mt-20 px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
          <BookmarkPlus className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Minha Watchlist</h1>
          <p className="text-zinc-400">Filmes que você quer assistir em breve.</p>
        </div>
      </div>

      {movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {movies.map((movie: any) => (
            <div key={movie.id} className="group relative">
              <MovieCard movie={movie} />
              {/* Overlay indicando se já foi visto */}
              {movie.watched && (
                <div className="absolute top-2 right-2 z-20 rounded-md bg-green-500 px-2 py-1 text-[10px] font-bold text-black shadow-md">
                  Visto
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-24 text-center">
          <BookmarkPlus className="mb-4 h-12 w-12 text-zinc-700" />
          <h3 className="mb-2 text-xl font-semibold text-white">Watchlist vazia</h3>
          <p className="max-w-md text-zinc-400">
            Você ainda não adicionou nenhum filme à sua watchlist. Navegue pelo catálogo e clique no
            botão de watchlist para organizar suas próximas sessões.
          </p>
        </div>
      )}
    </main>
  )
}
