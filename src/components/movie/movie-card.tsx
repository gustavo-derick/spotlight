import Image from 'next/image'
import Link from 'next/link'
import { Clapperboard } from 'lucide-react'
import type { Movie } from '@/types/database'

interface MovieCardProps {
  movie: Pick<Movie, 'id' | 'title_pt' | 'title_original' | 'poster_url' | 'release_date'> & {
    movie_ratings?: { source: string; score: number }[]
  }
  priority?: boolean
}

export function MovieCard({ movie, priority = false }: MovieCardProps) {
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  // Função auxiliar para formatar a nota dependendo da fonte
  const getRatingBadge = (rating: { source: string; score: number }) => {
    switch (rating.source) {
      case 'imdb':
        return (
          <span
            key="imdb"
            className="flex items-center gap-1 rounded bg-[#f5c518] px-1.5 py-0.5 text-[10px] font-black text-black"
            title="IMDb"
          >
            IMDb {rating.score.toFixed(1)}
          </span>
        )
      case 'rotten_tomatoes':
        return (
          <span
            key="rt"
            className="flex items-center gap-1 rounded bg-[#fa320a] px-1.5 py-0.5 text-[10px] font-bold text-white"
            title="Rotten Tomatoes"
          >
            RT {rating.score}%
          </span>
        )
      case 'letterboxd':
        return (
          <span
            key="lb"
            className="flex items-center gap-1 rounded border border-[#40bcf4]/30 bg-[#2c3440] px-1.5 py-0.5 text-[10px] font-bold text-[#00e054]"
            title="Letterboxd"
          >
            LB {rating.score.toFixed(1)}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <Link
      href={`/filme/${movie.id}`}
      className="group relative flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900 shadow-lg transition-colors group-hover:border-zinc-500/50">
        {movie.poster_url ? (
          <Image
            src={movie.poster_url}
            alt={movie.title_pt || movie.title_original}
            fill
            sizes="(max-width: 640px) 140px, (max-width: 1024px) 150px, 180px"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900">
            <Clapperboard className="h-12 w-12 text-zinc-700" />
          </div>
        )}

        {/* Gradient overlay on hover for better text readability if we add text inside */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex flex-col gap-1 px-1">
        <h3 className="line-clamp-1 text-sm leading-tight font-semibold text-zinc-100 transition-colors group-hover:text-white">
          {movie.title_pt || movie.title_original}
        </h3>
        <div className="flex items-center justify-between">
          {releaseYear && <span className="text-xs font-medium text-zinc-500">{releaseYear}</span>}
        </div>

        {/* Avaliações */}
        {movie.movie_ratings && movie.movie_ratings.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {movie.movie_ratings.map(getRatingBadge)}
          </div>
        )}
      </div>
    </Link>
  )
}
