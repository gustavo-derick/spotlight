'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { SearchBar } from '@/components/search/search-bar'

export function HeaderSearch() {
  const router = useRouter()

  const handleSearch = useCallback(
    (q: string) => {
      if (!q) return
      router.push(`/busca?q=${encodeURIComponent(q)}`)
    },
    [router],
  )

  return <SearchBar placeholder="Buscar filmes..." onSearch={handleSearch} className="w-64" />
}
