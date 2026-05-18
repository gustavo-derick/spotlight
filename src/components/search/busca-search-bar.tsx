'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { SearchBar } from './search-bar'

export function BuscaSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentQ = searchParams.get('q') ?? ''

  const handleSearch = useCallback(
    (q: string) => {
      const sp = new URLSearchParams(searchParams.toString())
      if (q) {
        sp.set('q', q)
      } else {
        sp.delete('q')
      }
      sp.delete('offset')
      router.replace(`/busca?${sp.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  // key força remount quando a URL muda externamente (ex: botão voltar do browser)
  return (
    <SearchBar
      key={currentQ}
      defaultValue={currentQ}
      placeholder="Buscar filmes por título..."
      onSearch={handleSearch}
      autoFocus
      className="w-full max-w-xl"
    />
  )
}
