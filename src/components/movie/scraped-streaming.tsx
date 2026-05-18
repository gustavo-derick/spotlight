'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { MonitorPlay, Search } from 'lucide-react'

interface ScrapedStreamingProps {
  title: string
}

interface Provider {
  provider_name: string
  provider_logo_url: string
}

export function ScrapedStreaming({ title }: ScrapedStreamingProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchScrapedData() {
      try {
        const response = await fetch(`/api/scrape-streaming?title=${encodeURIComponent(title)}`)

        if (!response.ok) {
          throw new Error('Failed to fetch')
        }

        const data = await response.json()
        setProviders(data.results || [])
      } catch (err) {
        console.error('Error fetching scraped streaming data:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchScrapedData()
  }, [title])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <MonitorPlay className="h-5 w-5 text-indigo-400" />
        Onde Assistir
      </h3>

      {loading ? (
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-zinc-800" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-32 rounded-md bg-zinc-800" />
            <div className="h-3 w-24 rounded-md bg-zinc-800" />
          </div>
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 text-sm text-zinc-500">
          <span>Não foi possível buscar as plataformas no momento.</span>
        </div>
      ) : providers.length > 0 ? (
        <div className="relative z-10 flex flex-wrap gap-3">
          {providers.map((provider, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2"
              title={provider.provider_name}
            >
              <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 shadow-md">
                {provider.provider_logo_url ? (
                  <Image
                    src={provider.provider_logo_url}
                    alt={provider.provider_name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <span className="text-center text-[10px] leading-tight font-bold text-zinc-400">
                    {provider.provider_name}
                  </span>
                )}
              </div>
              <span className="line-clamp-2 max-w-[60px] text-center text-[10px] leading-tight font-medium text-zinc-400">
                {provider.provider_name}
              </span>
            </div>
          ))}
          {/* Tag indicando que foi via web search */}
          <div className="absolute right-0 bottom-[-16px] flex items-center gap-1 text-[10px] text-zinc-600">
            <Search className="h-3 w-3" />
            <span>via Web</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-zinc-500">
          Nenhuma plataforma oficial de streaming encontrada no Brasil.
        </div>
      )}
    </div>
  )
}
