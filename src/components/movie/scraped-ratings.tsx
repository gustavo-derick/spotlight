'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface ScrapedRatingsProps {
  imdbId: string
}

export function ScrapedRatings({ imdbId }: ScrapedRatingsProps) {
  const [ratings, setRatings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!imdbId) {
      setLoading(false)
      return
    }
    const controller = new AbortController()

    fetch(`/api/scrape-ratings?imdbId=${imdbId}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setRatings(data.results || []))
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Error fetching ratings:', err)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [imdbId])

  if (loading) {
    return (
      <div className="flex animate-pulse flex-wrap gap-4 pt-2">
        <div className="h-8 w-20 rounded-lg bg-zinc-800/80"></div>
        <div className="h-8 w-20 rounded-lg bg-zinc-800/80"></div>
        <div className="h-8 w-20 rounded-lg bg-zinc-800/80"></div>
      </div>
    )
  }

  if (ratings.length === 0) return null

  const imdb = ratings.find((r: any) => r.source === 'imdb')
  const rt = ratings.find((r: any) => r.source === 'rotten_tomatoes')
  const lb = ratings.find((r: any) => r.source === 'letterboxd')

  return (
    <div className="relative flex flex-wrap gap-4 pt-2">
      {imdb && (
        <a
          href={imdb.url || '#'}
          target="_blank"
          rel="noreferrer"
          className="relative flex items-center gap-2 rounded-lg bg-[#f5c518] px-3 py-1.5 text-black transition-opacity hover:opacity-90"
          title="Avaliação via Web (IMDb)"
        >
          <span className="font-black">IMDb</span>
          <span className="text-sm font-semibold">{imdb.score.toFixed(1)}</span>
        </a>
      )}
      {rt && (
        <a
          href={rt.url || '#'}
          target="_blank"
          rel="noreferrer"
          className="relative flex items-center gap-2 rounded-lg bg-[#fa320a] px-3 py-1.5 text-white transition-opacity hover:opacity-90"
          title="Avaliação via Web (Rotten Tomatoes)"
        >
          <span className="font-bold">RT</span>
          <span className="text-sm font-semibold">{rt.score}%</span>
        </a>
      )}
      {lb && (
        <a
          href={lb.url || '#'}
          target="_blank"
          rel="noreferrer"
          className="relative flex items-center gap-2 rounded-lg border border-[#40bcf4]/30 bg-[#2c3440] px-3 py-1.5 text-[#00e054] transition-opacity hover:opacity-90"
          title="Avaliação via Web (Letterboxd)"
        >
          <span className="font-bold">LB</span>
          <span className="text-sm font-semibold">{lb.score.toFixed(1)}</span>
        </a>
      )}
      <div className="absolute -top-3 -right-3 rounded-sm border border-zinc-800 bg-zinc-900 px-1 text-[9px] text-zinc-500">
        via Web
      </div>
    </div>
  )
}
