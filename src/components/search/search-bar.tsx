'use client'

import { Search, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  defaultValue?: string
  placeholder?: string
  onSearch: (q: string) => void
  autoFocus?: boolean
  className?: string
}

export function SearchBar({
  defaultValue = '',
  placeholder = 'Buscar filmes...',
  onSearch,
  autoFocus = false,
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch(next.trim()), 300)
  }

  function handleClear() {
    setValue('')
    onSearch('')
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <Input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="rounded-full border-zinc-800 bg-zinc-900/50 pr-9 pl-9 focus-visible:ring-zinc-700"
      />
      {value && (
        <Button
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
