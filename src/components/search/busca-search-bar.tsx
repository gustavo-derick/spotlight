'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function BuscaSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQ = searchParams.get('q') ?? ''

  const [value, setValue] = useState(urlQ)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Rastreia o último valor que enviamos para a URL — evita override do input pelo useEffect
  const lastPushedRef = useRef(urlQ)

  // Sincroniza de volta quando a URL muda externamente (ex: botão voltar do browser)
  useEffect(() => {
    if (urlQ !== lastPushedRef.current) {
      setValue(urlQ)
      lastPushedRef.current = urlQ
    }
  }, [urlQ])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const trimmed = next.trim()
      lastPushedRef.current = trimmed
      const sp = new URLSearchParams(searchParams.toString())
      if (trimmed) {
        sp.set('q', trimmed)
      } else {
        sp.delete('q')
      }
      sp.delete('offset')
      router.replace(`/busca?${sp.toString()}`, { scroll: false })
    }, 300)
  }

  function handleClear() {
    setValue('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    lastPushedRef.current = ''
    const sp = new URLSearchParams(searchParams.toString())
    sp.delete('q')
    sp.delete('offset')
    router.replace(`/busca?${sp.toString()}`, { scroll: false })
  }

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <Input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Buscar filmes por título..."
        autoFocus
        className="rounded-full border-zinc-800 bg-zinc-900/50 pr-9 pl-9 focus-visible:ring-zinc-700"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          aria-label="Limpar busca"
          className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 rounded-full text-zinc-500 hover:bg-zinc-800"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
