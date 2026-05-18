import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MovieCard } from '@/components/movie/movie-card'
import { FolderHeart, Globe, Lock, User as UserIcon } from 'lucide-react'
import { RemoveFromCollectionButton } from '@/components/collections/remove-movie-button'

export const revalidate = 0 // Não faz cache pesado em página de lista mutável

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const response = await supabase
    .from('collections')
    .select('name, description')
    .eq('id', params.id)
    .single()
  const data = response.data as any

  if (!data) return { title: 'Coleção não encontrada | Spotlight' }

  return {
    title: `${data.name} | Spotlight Coleções`,
    description: data.description || 'Uma coleção personalizada no Spotlight.',
  }
}

export default async function CollectionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Buscar detalhes da coleção (o RLS barrará se não for pública nem do usuário logado)
  const response = await supabase
    .from('collections')
    .select(
      `
      id, name, description, is_public, user_id, created_at,
      profiles:user_id (id, display_name)
    `,
    )
    .eq('id', params.id)
    .single()

  const collection = response.data as any
  const error = response.error

  if (error || !collection) {
    notFound()
  }

  const isOwner = user?.id === collection.user_id

  // Buscar filmes da coleção
  const { data: collectionMovies } = await supabase
    .from('collection_movies')
    .select(
      `
      movie_id,
      added_at,
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
    .eq('collection_id', collection.id)
    .order('added_at', { ascending: false })

  const movies = collectionMovies?.map((cm: any) => cm.movies).filter(Boolean) || []

  // TODO: Buscar o display_name real se tivermos tabela profiles ou apenas mostrar o status.
  // Como profiles pode não estar linkado perfeitamente no momento, mostramos uma info genérica se não vier.
  const creatorName = (collection.profiles as any)?.display_name || 'Usuário Spotlight'

  return (
    <main className="container mx-auto flex flex-col px-4 py-12 md:py-20">
      {/* Cabecalho da Colecao */}
      <div className="relative mb-12 flex flex-col items-start overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8">
        <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/2 rounded-full bg-rose-500/10 blur-3xl" />

        <div className="mb-4 flex items-center gap-3 text-sm font-medium text-zinc-400">
          <span className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 py-1">
            {collection.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {collection.is_public ? 'Pública' : 'Privada'}
          </span>
          <span className="flex items-center gap-1.5">
            <UserIcon className="h-4 w-4" />
            Criado por {creatorName}
          </span>
        </div>

        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
          {collection.name}
        </h1>

        {collection.description && (
          <p className="max-w-2xl text-lg text-zinc-300">{collection.description}</p>
        )}
      </div>

      {/* Grade de Filmes */}
      {movies.length > 0 ? (
        <div className="relative grid grid-cols-2 gap-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {movies.map((movie: any) => (
            <div key={movie.id} className="group relative">
              <MovieCard movie={movie} />
              {isOwner && (
                <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                  <RemoveFromCollectionButton collectionId={collection.id} movieId={movie.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-20 text-center">
          <FolderHeart className="mb-4 h-12 w-12 text-zinc-700" />
          <h3 className="mb-2 text-xl font-semibold text-white">Coleção Vazia</h3>
          <p className="max-w-md text-zinc-400">Nenhum filme foi adicionado a esta lista ainda.</p>
        </div>
      )}
    </main>
  )
}
