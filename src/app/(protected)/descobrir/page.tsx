import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SwipeDeck } from '@/components/movie/swipe-deck'

export const metadata = {
  title: 'Descobrir | Spotlight',
  description: 'Descubra novos filmes para assistir',
}

export default async function DescobrirPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/entrar')
  }

  // Busca os primeiros filmes via RPC diretamente do servidor
  const { data: initialMovies, error } = await (supabase as any).rpc('get_discovery_movies', {
    p_user_id: user.id,
    p_limit: 10,
  })

  if (error) {
    console.error('Erro ao buscar filmes no discovery:', error)
  }

  return (
    <main className="container mx-auto mt-12 flex flex-col items-center px-4 py-8 md:mt-20">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">Descobrir</h1>
        <p className="text-zinc-400">
          Arraste para a <strong className="text-green-500">direita</strong> para adicionar à
          Watchlist.
          <br />
          Arraste para a <strong className="text-rose-500">esquerda</strong> para passar.
        </p>
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        <SwipeDeck initialMovies={initialMovies || []} />
      </div>
    </main>
  )
}
