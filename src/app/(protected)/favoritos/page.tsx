import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MovieCard } from '@/components/movie/movie-card'
import { Heart } from 'lucide-react'

export const metadata = {
  title: 'Meus Favoritos | Spotlight',
}

export default async function FavoritosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/entrar')
  }

  // Buscar filmes favoritados do usuário atual
  const { data: favorites, error } = await supabase
    .from('user_favorites')
    .select(
      `
      movie_id,
      created_at,
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
    console.error('Erro ao buscar favoritos:', error)
  }

  const movies = favorites?.map((f: any) => f.movies).filter(Boolean) || []

  return (
    <main className="container mx-auto mt-20 px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
          <Heart className="h-6 w-6 fill-current text-rose-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Meus Favoritos</h1>
          <p className="text-zinc-400">Filmes que você curtiu e salvou para sempre.</p>
        </div>
      </div>

      {movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {movies.map((movie: any) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-24 text-center">
          <Heart className="mb-4 h-12 w-12 text-zinc-700" />
          <h3 className="mb-2 text-xl font-semibold text-white">Nenhum favorito ainda</h3>
          <p className="max-w-md text-zinc-400">
            Você ainda não adicionou nenhum filme aos seus favoritos. Navegue pelo catálogo e clique
            no botão de favoritar para começar sua coleção.
          </p>
        </div>
      )}
    </main>
  )
}
