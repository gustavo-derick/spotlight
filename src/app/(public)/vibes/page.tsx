import { createClient } from '@/lib/supabase/server'
import { VIBES, type Vibe } from '@/config/vibes'
import { VibeCard } from '@/components/vibes/vibe-card'
import { Sparkles } from 'lucide-react'

export const revalidate = 3600

export const metadata = {
  title: 'Vibes | Spotlight',
  description: 'Descubra filmes baseados no seu humor e estado de espírito.',
}

async function fetchPosters(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vibe: Vibe,
): Promise<string[]> {
  let q: any = supabase.from('movies').select('poster_url').not('poster_url', 'is', null).limit(6)

  if (vibe.filters.tmdb_ids?.length) {
    q = q.in('tmdb_id', vibe.filters.tmdb_ids.slice(0, 14))
  } else {
    if (vibe.filters.genre_ids?.length) {
      q = q.overlaps('genres', vibe.filters.genre_ids)
    }
    if (vibe.filters.year_from) {
      q = q.gte('release_date', `${vibe.filters.year_from}-01-01`)
    }
    if (vibe.filters.year_to) {
      q = q.lte('release_date', `${vibe.filters.year_to}-12-31`)
    }
  }

  const { data } = (await q) as { data: Array<{ poster_url: string | null }> | null }
  return (data ?? []).map((m) => m.poster_url).filter((u): u is string => u !== null)
}

export default async function VibesPage() {
  const supabase = await createClient()

  const postersByVibe = await Promise.all(VIBES.map((v) => fetchPosters(supabase, v)))

  const vibesWithPosters = VIBES.map((vibe, i) => ({ vibe, posters: postersByVibe[i] ?? [] }))
  const featured = vibesWithPosters.filter(({ vibe }) => vibe.featured)
  const regular = vibesWithPosters.filter(({ vibe }) => !vibe.featured)

  return (
    <main className="container mx-auto flex flex-col items-center px-4 py-12 md:py-20">
      <div className="mb-12 max-w-2xl text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Sparkles className="h-8 w-8 text-yellow-400" />
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">Vibes</h1>
        </div>
        <p className="text-lg text-zinc-400">
          Como você está se sentindo hoje? Escolha o seu estado de espírito e nós encontramos os
          filmes perfeitos para o momento.
        </p>
      </div>

      <div className="flex w-full max-w-6xl flex-col gap-5">
        {/* Vibes em destaque */}
        {featured.map(({ vibe, posters }) => (
          <VibeCard key={vibe.slug} vibe={vibe} posters={posters} />
        ))}

        {/* Grid das demais vibes */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {regular.map(({ vibe, posters }) => (
            <VibeCard key={vibe.slug} vibe={vibe} posters={posters} />
          ))}
        </div>
      </div>
    </main>
  )
}
