import { MovieCard } from './movie-card'
import type { Movie } from '@/types/database'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface MovieRowProps {
  title: string
  movies: (Pick<Movie, 'id' | 'title_pt' | 'title_original' | 'poster_url' | 'release_date'> & {
    movie_ratings?: { source: string; score: number }[]
  })[]
  viewAllLink?: string
}

export function MovieRow({ title, movies, viewAllLink }: MovieRowProps) {
  if (!movies || movies.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-4 py-6">
      <div className="flex items-center justify-between px-4 md:px-8">
        <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">{title}</h2>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="flex items-center text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Ver todos
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Container for horizontal scrolling */}
      <div className="relative w-full">
        {/* Left fade out gradient - hidden on mobile */}
        <div className="from-background pointer-events-none absolute top-0 bottom-0 left-0 z-10 hidden w-8 bg-gradient-to-r to-transparent md:block" />

        <div className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-2 pb-6 md:px-8">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="w-[120px] flex-none snap-start md:w-[150px] lg:w-[180px]"
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>

        {/* Right fade out gradient - hidden on mobile */}
        <div className="from-background pointer-events-none absolute top-0 right-0 bottom-0 z-10 hidden w-16 bg-gradient-to-l to-transparent md:block" />
      </div>
    </section>
  )
}
