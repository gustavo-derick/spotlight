import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { FilterPanel } from '@/components/search/filter-panel'
import { SearchResults } from '@/components/search/search-results'
import { BuscaSearchBar } from '@/components/search/busca-search-bar'

export const metadata: Metadata = {
  title: 'Busca',
  description: 'Encontre filmes por título, gênero ou ano.',
}

const ResultSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-800/50" />
    ))}
  </div>
)

export default async function BuscaPage() {
  const supabase = await createClient()
  const { data: genres } = await supabase.from('genres').select('tmdb_id, name_pt').order('name_pt')

  return (
    <div className="container mx-auto flex flex-col gap-8 px-4 py-8 md:px-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Buscar Filmes</h1>
        <p className="mt-1 text-sm text-zinc-500">Encontre filmes por título, gênero ou ano.</p>
      </div>

      <Suspense>
        <BuscaSearchBar />
      </Suspense>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="shrink-0 lg:w-56">
          <Suspense>
            <FilterPanel genres={genres ?? []} />
          </Suspense>
        </aside>

        <div className="min-w-0 flex-1">
          <Suspense fallback={<ResultSkeleton />}>
            <SearchResults />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
