'use client'

import { useState } from 'react'
import { MovieCard } from './movie-card'
import { Button } from '@/components/ui/button'

type GridMovie = {
  id: string
  title_pt: string
  title_original: string
  poster_url: string | null
  release_date: string | null
  movie_ratings?: { source: string; score: number }[]
}

const PAGE_SIZE = 24

export function MovieGrid({ movies }: { movies: GridMovie[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE)

  const shown = movies.slice(0, visible)
  const hasMore = visible < movies.length

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {shown.map((movie, i) => (
          <MovieCard key={movie.id} movie={movie} priority={i < 6} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="border-zinc-700 px-10 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  )
}
