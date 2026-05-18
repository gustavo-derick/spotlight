import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock, Film, Trophy, TrendingUp, Star, Zap } from 'lucide-react'
import { BadgesWall } from '@/components/profile/badges-wall'
import { GenresChart } from '@/components/profile/genres-chart'

export const metadata = {
  title: 'Meu Perfil | Spotlight',
}

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/entrar')
  }

  // Buscar estatísticas pela função RPC
  // @ts-ignore: O @supabase/ssr não reconhece parâmetros para essa RPC gerada
  const { data: stats, error } = await supabase.rpc('get_user_profile_stats', {
    target_user_id: user.id,
  })

  if (error) {
    console.error('Erro ao buscar estatísticas:', error)
  }

  const { total_movies = 0, total_runtime = 0, favorite_genres = [] } = (stats as any) || {}

  // Cálculo de tempo
  const days = Math.floor(total_runtime / (24 * 60))
  const hours = Math.floor((total_runtime % (24 * 60)) / 60)
  const minutes = total_runtime % 60

  const timeString =
    days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  const topGenre = favorite_genres.length > 0 ? favorite_genres[0].name : 'Nenhum'

  return (
    <main className="container mx-auto mt-20 px-4 py-8">
      {/* Header do Perfil */}
      <div className="mb-12 flex items-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 shadow-lg shadow-rose-500/20">
          <span className="text-4xl font-bold text-white">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Meu Perfil</h1>
          <p className="mt-1 text-zinc-400">{user.email}</p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="mb-2 flex items-center gap-3 text-blue-400">
            <Film className="h-5 w-5" />
            <h3 className="font-medium">Filmes Favoritados</h3>
          </div>
          <p className="text-4xl font-black text-white">{total_movies}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="mb-2 flex items-center gap-3 text-rose-400">
            <Clock className="h-5 w-5" />
            <h3 className="font-medium">Tempo Assistido</h3>
          </div>
          <p className="text-4xl font-black text-white">{timeString}</p>
          <p className="mt-1 text-sm text-zinc-500">{total_runtime} minutos no total</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="mb-2 flex items-center gap-3 text-emerald-400">
            <Star className="h-5 w-5" />
            <h3 className="font-medium">Gênero Favorito</h3>
          </div>
          <p className="truncate text-4xl font-black text-white">{topGenre}</p>
        </div>
      </div>

      {/* Grid Inferior: Gráficos e Badges */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Gráfico de Gêneros */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Sua Dieta Cinematográfica</h2>
          </div>
          <GenresChart genres={favorite_genres} />
        </div>

        {/* Badges / Conquistas */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="mb-6 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Mural de Conquistas</h2>
          </div>
          <BadgesWall stats={{ total_movies, total_runtime, favorite_genres }} />
        </div>
      </div>
    </main>
  )
}
