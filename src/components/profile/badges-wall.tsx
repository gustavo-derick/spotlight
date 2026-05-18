'use client'

import { motion } from 'framer-motion'
import { Flame, Star, Clock, Heart, Award, Ghost } from 'lucide-react'

interface BadgesWallProps {
  stats: {
    total_movies: number
    total_runtime: number
    favorite_genres: { name: string; count: number }[]
  }
}

export function BadgesWall({ stats }: BadgesWallProps) {
  const { total_movies, total_runtime, favorite_genres } = stats

  const topGenre = favorite_genres[0]?.name || ''

  const availableBadges = [
    {
      id: 'iniciante',
      title: 'Primeiro Passo',
      description: 'Favoritou seu primeiro filme.',
      icon: Star,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10 border-yellow-400/20',
      earned: total_movies > 0,
    },
    {
      id: 'maratonista',
      title: 'Maratonista',
      description: 'Mais de 30h de tempo assistido.',
      icon: Clock,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10 border-rose-400/20',
      earned: total_runtime >= 1800, // 30h
    },
    {
      id: 'pipoca',
      title: 'Fã de Pipoca',
      description: 'Gênero Ação ou Aventura domina sua lista.',
      icon: Flame,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10 border-orange-400/20',
      earned: topGenre === 'Ação' || topGenre === 'Aventura' || topGenre === 'Ficção científica',
    },
    {
      id: 'cult',
      title: 'Cinéfilo Cult',
      description: 'Focado em Dramas ou Documentários.',
      icon: Award,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10 border-indigo-400/20',
      earned: topGenre === 'Drama' || topGenre === 'Documentário',
    },
    {
      id: 'colecionador',
      title: 'Colecionador',
      description: 'Mais de 50 filmes favoritados.',
      icon: Heart,
      color: 'text-pink-400',
      bg: 'bg-pink-400/10 border-pink-400/20',
      earned: total_movies >= 50,
    },
    {
      id: 'terror',
      title: 'Caça-Fantasmas',
      description: 'Maior fã do gênero Terror.',
      icon: Ghost,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20',
      earned: topGenre === 'Terror',
    },
  ]

  const earnedBadges = availableBadges.filter((b) => b.earned)
  const lockedBadges = availableBadges.filter((b) => !b.earned)

  return (
    <div className="space-y-6">
      {/* Conquistadas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {earnedBadges.map((badge, i) => {
          const Icon = badge.icon
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center ${badge.bg}`}
            >
              <div className={`rounded-full bg-black/40 p-3 ${badge.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h4 className={`text-sm font-bold ${badge.color}`}>{badge.title}</h4>
              <p className="text-[10px] text-zinc-300">{badge.description}</p>
            </motion.div>
          )
        })}
      </div>

      {earnedBadges.length === 0 && (
        <p className="py-4 text-center text-sm text-zinc-500">Você ainda não possui conquistas.</p>
      )}

      {/* Bloqueadas (Opacas) */}
      {lockedBadges.length > 0 && (
        <>
          <h3 className="mt-8 mb-4 text-xs font-bold tracking-wider text-zinc-600 uppercase">
            Ainda Bloqueadas
          </h3>
          <div className="pointer-events-none grid grid-cols-2 gap-4 opacity-40 grayscale sm:grid-cols-3">
            {lockedBadges.map((badge) => {
              const Icon = badge.icon
              return (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center"
                >
                  <div className="rounded-full bg-zinc-800 p-3 text-zinc-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-400">{badge.title}</h4>
                  <p className="text-[10px] text-zinc-500">{badge.description}</p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
