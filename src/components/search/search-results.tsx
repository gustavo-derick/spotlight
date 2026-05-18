'use client'

import { useSearchParams } from 'next/navigation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { MovieCard } from '@/components/movie/movie-card'
import { Button } from '@/components/ui/button'
import type { SearchResult } from '@/lib/search/query-builder'

async function fetchPage(
  q: string,
  genres: string,
  yearFrom: string,
  yearTo: string,
  minImdbScore: string,
  offset: number,
): Promise<SearchResult> {
  const sp = new URLSearchParams()
  if (q) sp.set('q', q)
  if (genres) sp.set('genres', genres)
  if (yearFrom) sp.set('yearFrom', yearFrom)
  if (yearTo) sp.set('yearTo', yearTo)
  if (minImdbScore) sp.set('minImdbScore', minImdbScore)
  sp.set('limit', '20')
  sp.set('offset', String(offset))

  const res = await fetch(`/api/search?${sp.toString()}`)
  if (!res.ok) throw new Error('Erro ao buscar filmes')
  return res.json() as Promise<SearchResult>
}

const Skeleton = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-800/50" />
    ))}
  </div>
)

export function SearchResults() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const genres = searchParams.get('genres') ?? ''
  const yearFrom = searchParams.get('yearFrom') ?? ''
  const yearTo = searchParams.get('yearTo') ?? ''
  const minImdbScore = searchParams.get('minImdbScore') ?? ''

  const hasFilters = Boolean(q || genres || yearFrom || yearTo || minImdbScore)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, isFetching } =
    useInfiniteQuery({
      queryKey: ['search', q, genres, yearFrom, yearTo, minImdbScore],
      queryFn: ({ pageParam }) =>
        fetchPage(q, genres, yearFrom, yearTo, minImdbScore, (pageParam as number) * 20),
      getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
      initialPageParam: 0,
      enabled: hasFilters,
    })

  if (!hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-zinc-500">Use a busca ou os filtros para encontrar filmes.</p>
      </div>
    )
  }

  if (isFetching && !data) {
    return <Skeleton />
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-red-400">Erro ao buscar filmes. Tente novamente.</p>
      </div>
    )
  }

  const allMovies = data?.pages.flatMap((p) => p.movies) ?? []

  if (allMovies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-zinc-500">Nenhum filme encontrado com esses filtros.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {allMovies.map((movie, i) => (
          <MovieCard key={movie.id} movie={movie} priority={i < 5} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="border-zinc-700 px-8 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Carregar mais'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
