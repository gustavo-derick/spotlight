'use client'

import { Search, X, Loader2, Calendar } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type QuickResult = {
  id: string
  title_pt: string
  title_original: string
  poster_url: string | null
  release_date: string | null
}

// Remove chars que quebram o parser do PostgREST no .or()
function sanitize(q: string) {
  return q.replace(/[%,()]/g, ' ').trim()
}

export function DynamicSearch({ className }: { className?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<QuickResult[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(async (raw: string) => {
    const q = sanitize(raw)
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('movies')
        .select('id, title_pt, title_original, poster_url, release_date')
        .or(`title_pt.ilike.%${q}%,title_original.ilike.%${q}%`)
        .not('poster_url', 'is', null)
        .order('release_date', { ascending: false })
        .limit(5)

      setResults((data ?? []) as QuickResult[])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setIsOpen(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  function navigate() {
    if (!query.trim()) return
    setIsOpen(false)
    setResults([])
    router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      navigate()
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setIsOpen(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ''} w-full max-w-sm`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim()) setIsOpen(true)
          }}
          placeholder="Buscar filmes..."
          autoComplete="off"
          className="w-full rounded-full border-zinc-800 bg-zinc-900/50 pr-9 pl-9 focus-visible:ring-zinc-700"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 rounded-full text-zinc-500 hover:bg-zinc-800"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </form>

      {isOpen && query.trim() && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
          {loading && results.length === 0 ? (
            <div className="flex justify-center p-4 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col">
              {results.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/filme/${movie.id}`}
                  onClick={() => {
                    setIsOpen(false)
                    setResults([])
                  }}
                  className="flex items-center gap-3 border-b border-zinc-800/50 p-3 transition-colors last:border-0 hover:bg-zinc-800"
                >
                  <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title_pt || movie.title_original}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-[10px] text-zinc-500">S/Img</span>
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-zinc-100">
                      {movie.title_pt || movie.title_original}
                    </span>
                    {movie.release_date && (
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(movie.release_date).getFullYear()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              <button
                type="button"
                onClick={navigate}
                className="bg-zinc-950/50 p-3 text-center text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                Ver todos os resultados para &ldquo;{query}&rdquo;
              </button>
            </div>
          ) : !loading ? (
            <div className="p-4 text-center text-sm text-zinc-500">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
