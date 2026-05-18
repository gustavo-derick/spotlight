import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderHeart, Lock, Globe, Film } from 'lucide-react'
import { CreateCollectionDialog } from '@/components/collections/create-collection-dialog'

export const metadata = {
  title: 'Minhas Coleções | Spotlight',
}

export default async function ColecoesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/entrar')
  }

  // Buscar coleções do usuário
  const { data: collections, error } = await supabase
    .from('collections')
    .select(
      `
      id, name, description, is_public, created_at,
      collection_movies (count)
    `,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar coleções:', error)
  }

  return (
    <main className="container mx-auto mt-20 px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/80 p-3">
            <FolderHeart className="h-6 w-6 text-zinc-100" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Minhas Coleções</h1>
            <p className="text-zinc-400">Suas listas personalizadas de filmes.</p>
          </div>
        </div>
        <CreateCollectionDialog />
      </div>

      {collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection: any) => {
            const movieCount = collection.collection_movies?.[0]?.count || 0

            return (
              <Link
                key={collection.id}
                href={`/colecoes/${collection.id}`}
                className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:bg-zinc-800/50"
              >
                <div className="absolute top-4 right-4 text-zinc-500">
                  {collection.is_public ? (
                    <Globe className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-zinc-800 p-2 transition-colors group-hover:bg-zinc-700">
                    <FolderHeart className="h-5 w-5 text-zinc-300" />
                  </div>
                  <h2 className="truncate pr-6 text-xl font-semibold text-white">
                    {collection.name}
                  </h2>
                </div>

                <p className="mb-6 line-clamp-2 min-h-[40px] text-sm text-zinc-400">
                  {collection.description || 'Sem descrição.'}
                </p>

                <div className="flex items-center text-xs font-medium text-zinc-500">
                  <Film className="mr-1.5 h-4 w-4" />
                  {movieCount} {movieCount === 1 ? 'filme' : 'filmes'}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-24 text-center">
          <FolderHeart className="mb-4 h-12 w-12 text-zinc-700" />
          <h3 className="mb-2 text-xl font-semibold text-white">Nenhuma coleção ainda</h3>
          <p className="mb-6 max-w-md text-zinc-400">
            Você ainda não criou nenhuma lista de filmes. Crie sua primeira coleção agora mesmo.
          </p>
          <CreateCollectionDialog />
        </div>
      )}
    </main>
  )
}
