'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { User, Star, MessageSquareQuote } from 'lucide-react'

interface MovieReviewsProps {
  tmdbId: number
}

export function MovieReviews({ tmdbId }: MovieReviewsProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tmdbId) {
      setLoading(false)
      return
    }
    const controller = new AbortController()

    fetch(`/api/movie-reviews?tmdbId=${tmdbId}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setReviews(data.results || []))
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Error fetching reviews:', err)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [tmdbId])

  if (loading) {
    return (
      <div className="mt-16 w-full animate-pulse">
        <h3 className="mb-6 text-xl font-semibold text-white">O que estão achando</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6"
            ></div>
          ))}
        </div>
      </div>
    )
  }

  if (reviews.length === 0) return null

  return (
    <div className="mt-16 mb-8 w-full">
      <div className="mb-6 flex items-center gap-2">
        <MessageSquareQuote className="h-5 w-5 text-zinc-400" />
        <h3 className="text-xl font-semibold text-white">Opiniões de Espectadores</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex flex-col rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-6 transition-colors hover:border-zinc-700/50"
          >
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                {review.authorDetails.avatarPath ? (
                  <Image
                    src={review.authorDetails.avatarPath}
                    alt={review.authorDetails.name || review.author}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-zinc-500" />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="line-clamp-1 font-medium text-zinc-200">
                  {review.authorDetails.name || review.author}
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {review.authorDetails.rating && (
                <div className="flex items-center gap-1 rounded-md bg-zinc-800/80 px-2 py-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                  <span className="text-xs font-semibold text-zinc-300">
                    {review.authorDetails.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="relative flex-1">
              <p className="line-clamp-4 text-sm leading-relaxed text-zinc-400">
                {/* Tratar quebra de linhas para exibição limpa */}
                {review.content.replace(/\r\n/g, ' ').replace(/\n/g, ' ')}
              </p>
            </div>

            <div className="mt-4 border-t border-zinc-800/50 pt-3">
              <a
                href={review.url}
                target="_blank"
                rel="noreferrer"
                className="flex w-max items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-white"
              >
                Ler review completo
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
