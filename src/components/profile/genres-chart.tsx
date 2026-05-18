'use client'

import { motion } from 'framer-motion'
import { Clapperboard } from 'lucide-react'

interface Genre {
  name: string
  count: number
}

interface GenresChartProps {
  genres: Genre[]
}

export function GenresChart({ genres }: GenresChartProps) {
  if (!genres || genres.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
        <Clapperboard className="mb-3 h-10 w-10 opacity-50" />
        <p>Você ainda não favoritou filmes o suficiente para gerar o gráfico.</p>
      </div>
    )
  }

  const maxCount = Math.max(...genres.map((g) => g.count))

  return (
    <div className="space-y-4">
      {genres.map((genre, index) => {
        const percentage = Math.max((genre.count / maxCount) * 100, 5) // Mínimo de 5% para visibilidade

        return (
          <div key={genre.name} className="relative">
            <div className="mb-1 flex items-end justify-between text-sm">
              <span className="font-medium text-zinc-300">{genre.name}</span>
              <span className="font-mono text-zinc-500">{genre.count}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, delay: index * 0.1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-rose-500"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
