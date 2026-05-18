'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion'
import { recordSwipeAction, getDiscoveryMoviesAction } from '@/lib/actions/user'
import { useAction } from 'next-safe-action/hooks'
import Image from 'next/image'
import { BookmarkPlus, X } from 'lucide-react'
import Link from 'next/link'

interface Movie {
  id: string
  title_pt: string
  overview_pt: string | null
  poster_url: string | null
  release_date: string | null
  genres: number[]
}

export function SwipeDeck({ initialMovies }: { initialMovies: Movie[] }) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies)
  const [isFetching, setIsFetching] = useState(false)
  const { execute: recordSwipe } = useAction(recordSwipeAction)
  const { execute: fetchMore } = useAction(getDiscoveryMoviesAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.movies) {
        // Filtramos para evitar duplicações se chegarem iguais
        setMovies((prev) => {
          const newIds = new Set(prev.map((m) => m.id))
          const toAdd = data.movies.filter((m: any) => !newIds.has(m.id))
          return [...prev, ...toAdd]
        })
      }
      setIsFetching(false)
    },
    onError: () => setIsFetching(false),
  })

  // Checar se precisamos recarregar o deck
  useEffect(() => {
    if (movies.length < 3 && !isFetching) {
      setIsFetching(true)
      fetchMore()
    }
  }, [movies.length, isFetching, fetchMore])

  if (movies.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Você viu tudo!</h2>
        <p className="text-zinc-400">Não há mais filmes nas suas recomendações agora.</p>
        <p className="mt-2 text-sm text-zinc-500">
          Mas tem muito mais processando no nosso catálogo!
        </p>
      </div>
    )
  }

  // O componente Card representa a carta do topo
  const topMovie = movies[0]
  const nextMovie = movies[1]

  return (
    <div className="relative mx-auto flex h-[600px] w-full max-w-sm items-center justify-center">
      {/* Carta de baixo (estática para efeito visual) */}
      {nextMovie && (
        <div className="absolute inset-0 z-0 h-full w-full translate-y-4 scale-[0.95] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 opacity-50">
          {nextMovie.poster_url && (
            <Image
              src={`https://image.tmdb.org/t/p/w780${nextMovie.poster_url}`}
              alt={nextMovie.title_pt}
              fill
              className="object-cover"
            />
          )}
        </div>
      )}

      {/* Carta do topo (animada e interagível) */}
      {topMovie && (
        <SwipeCard
          key={topMovie.id}
          movie={topMovie}
          onSwipe={(dir) => {
            recordSwipe({ movieId: topMovie.id, direction: dir })
            setMovies((prev) => prev.slice(1))
          }}
        />
      )}
    </div>
  )
}

function SwipeCard({ movie, onSwipe }: { movie: Movie; onSwipe: (dir: 'left' | 'right') => void }) {
  const x = useMotionValue(0)
  // Rotação leve baseada no X
  const rotate = useTransform(x, [-200, 200], [-10, 10])
  // Opacidade de botões/feedbacks baseada no X
  const opacityRight = useTransform(x, [0, 100], [0, 1])
  const opacityLeft = useTransform(x, [0, -100], [0, 1])

  const controls = useAnimation()

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 100 // quantos px precisa arrastar para validar o swipe
      if (info.offset.x > threshold) {
        // Animamos a carta voando pra fora
        controls
          .start({ x: 500, opacity: 0, transition: { duration: 0.3 } })
          .then(() => onSwipe('right'))
      } else if (info.offset.x < -threshold) {
        controls
          .start({ x: -500, opacity: 0, transition: { duration: 0.3 } })
          .then(() => onSwipe('left'))
      } else {
        // Volta ao centro
        controls.start({
          x: 0,
          rotate: 0,
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        })
      }
    },
    [controls, onSwipe],
  )

  const handleButtonSwipe = (dir: 'left' | 'right') => {
    const sign = dir === 'right' ? 1 : -1
    controls
      .start({ x: 500 * sign, opacity: 0, transition: { duration: 0.3 } })
      .then(() => onSwipe(dir))
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }} // Prende levemente ao centro, mas permite puxar livremente
      dragElastic={1} // Arrasto muito elástico
      style={{ x, rotate }}
      animate={controls}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 z-10 flex h-full w-full cursor-grab flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl active:cursor-grabbing"
    >
      {/* Background Poster */}
      <div className="pointer-events-none absolute inset-0 h-full w-full">
        {movie.poster_url ? (
          <Image
            src={`https://image.tmdb.org/t/p/w780${movie.poster_url}`}
            alt={movie.title_pt}
            fill
            className="object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800">
            <span className="text-zinc-500">Sem imagem</span>
          </div>
        )}
        {/* Gradiente escuro no rodapé para leitura */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      {/* Feedbacks de Like / Pass (aparecem baseados no drag) */}
      <motion.div
        style={{ opacity: opacityRight }}
        className="pointer-events-none absolute top-10 left-10 z-20 rotate-[-15deg] rounded-xl border-4 border-green-500 bg-black/20 px-4 py-2 text-4xl font-bold text-green-500 uppercase shadow-lg backdrop-blur-sm"
      >
        QUERO VER
      </motion.div>
      <motion.div
        style={{ opacity: opacityLeft }}
        className="pointer-events-none absolute top-10 right-10 z-20 rotate-[15deg] rounded-xl border-4 border-rose-500 bg-black/20 px-4 py-2 text-4xl font-bold text-rose-500 uppercase shadow-lg backdrop-blur-sm"
      >
        PASSAR
      </motion.div>

      {/* Conteúdo no Rodapé */}
      <div className="pointer-events-auto z-20 mt-auto flex flex-col p-6">
        <Link
          href={`/filme/${movie.id}`}
          target="_blank"
          className="decoration-white/50 hover:underline"
        >
          <h2 className="text-3xl leading-tight font-bold text-white">{movie.title_pt}</h2>
        </Link>
        <p className="mt-2 line-clamp-3 text-sm text-zinc-300">
          {movie.overview_pt || 'Sem sinopse disponível.'}
        </p>

        {/* Botões de Ação Manuais */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            onClick={() => handleButtonSwipe('left')}
            className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/80 text-rose-500 shadow-xl backdrop-blur transition-transform hover:bg-zinc-700 active:scale-95"
            aria-label="Passar filme"
          >
            <X className="h-8 w-8" strokeWidth={3} />
          </button>

          <button
            onClick={() => handleButtonSwipe('right')}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-xl transition-transform hover:bg-zinc-200 active:scale-95"
            aria-label="Adicionar à Watchlist"
          >
            <BookmarkPlus className="h-8 w-8" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
