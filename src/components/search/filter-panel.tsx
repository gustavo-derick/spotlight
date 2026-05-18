'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { Genre } from '@/types/database'

interface FilterPanelProps {
  genres: Genre[]
}

export function FilterPanel({ genres }: FilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeGenres = (searchParams.get('genres') ?? '').split(',').map(Number).filter(Boolean)

  const yearFrom = searchParams.get('yearFrom') ?? ''
  const yearTo = searchParams.get('yearTo') ?? ''
  const minImdbScore = searchParams.get('minImdbScore') ?? ''

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams.toString())
      for (const [key, val] of Object.entries(updates)) {
        if (!val) {
          sp.delete(key)
        } else {
          sp.set(key, val)
        }
      }
      sp.delete('offset')
      router.replace(`/busca?${sp.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  function toggleGenre(tmdbId: number) {
    const next = activeGenres.includes(tmdbId)
      ? activeGenres.filter((g) => g !== tmdbId)
      : [...activeGenres, tmdbId]
    updateParams({ genres: next.length > 0 ? next.join(',') : null })
  }

  function clearFilters() {
    const sp = new URLSearchParams(searchParams.toString())
    sp.delete('genres')
    sp.delete('yearFrom')
    sp.delete('yearTo')
    sp.delete('minImdbScore')
    sp.delete('offset')
    router.replace(`/busca?${sp.toString()}`, { scroll: false })
  }

  const hasActiveFilters = activeGenres.length > 0 || yearFrom || yearTo || minImdbScore

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-300">Filtros</p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Limpar
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Gênero</p>
        <div className="flex flex-wrap gap-1.5">
          {genres.map((g) => {
            const active = activeGenres.includes(g.tmdb_id)
            return (
              <button
                key={g.tmdb_id}
                onClick={() => toggleGenre(g.tmdb_id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-white bg-white text-black'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                {g.name_pt}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Ano</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="De"
            min={1900}
            max={2100}
            value={yearFrom}
            onChange={(e) => updateParams({ yearFrom: e.target.value || null })}
            className="w-20 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          <span className="text-sm text-zinc-600">—</span>
          <input
            type="number"
            placeholder="Até"
            min={1900}
            max={2100}
            value={yearTo}
            onChange={(e) => updateParams({ yearTo: e.target.value || null })}
            className="w-20 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          Nota IMDb mínima
        </p>
        <div className="flex flex-wrap gap-1.5">
          {['', '5', '6', '7', '8'].map((score) => {
            const label = score === '' ? 'Qualquer' : `≥ ${score}`
            const active = minImdbScore === score
            return (
              <button
                key={score}
                onClick={() => updateParams({ minImdbScore: score || null })}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-yellow-400/40 bg-yellow-400/20 text-yellow-400'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
