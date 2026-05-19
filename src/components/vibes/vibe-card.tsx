'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Vibe } from '@/config/vibes'

interface VibeCardProps {
  vibe: Vibe
  posters: string[]
}

export function VibeCard({ vibe, posters }: VibeCardProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (posters.length <= 1) return
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % posters.length), 3800)
    return () => clearInterval(id)
  }, [posters.length])

  if (vibe.featured) {
    return (
      <Link
        href={`/vibes/${vibe.slug}`}
        className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:brightness-110 active:scale-[0.995]"
      >
        {/* Poster cycling */}
        <div className="absolute inset-0">
          {posters.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn(
                'object-cover transition-opacity duration-[1200ms] ease-in-out',
                i === activeIdx ? 'opacity-100' : 'opacity-0',
              )}
            />
          ))}
          {posters.length === 0 && (
            <div className={cn('absolute inset-0 bg-gradient-to-br', vibe.colors)} />
          )}
        </div>

        {/* Overlays */}
        <div className={cn('absolute inset-0 bg-gradient-to-br', vibe.colors, 'opacity-70')} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />

        {/* Content */}
        <div className="relative flex min-h-[200px] flex-col justify-between gap-4 p-7 md:min-h-[220px] md:flex-row md:items-center md:p-10">
          <div className="flex items-center gap-5">
            <span className="text-5xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12 md:text-7xl">
              {vibe.emoji}
            </span>
            <div>
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[10px] font-semibold tracking-widest text-white/80 uppercase backdrop-blur-sm">
                <Shuffle className="h-3 w-3" />
                Seleção especial
              </span>
              <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-white drop-shadow-lg md:text-3xl">
                {vibe.name}
              </h2>
              <p className="mt-1 max-w-lg text-base font-medium text-white/75">
                {vibe.description}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors duration-200 group-hover:bg-black/60">
              Descobrir filmes
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>

        {/* Poster count dots */}
        {posters.length > 1 && (
          <div className="absolute right-4 bottom-3 flex gap-1">
            {posters.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'block h-1 rounded-full transition-all duration-500',
                  i === activeIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/40',
                )}
              />
            ))}
          </div>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={`/vibes/${vibe.slug}`}
      className="group relative aspect-[4/3] overflow-hidden rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:brightness-110 active:scale-[0.98]"
    >
      {/* Poster cycling */}
      <div className="absolute inset-0">
        {posters.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className={cn(
              'object-cover transition-opacity duration-[1200ms] ease-in-out',
              i === activeIdx ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
        {posters.length === 0 && (
          <div className={cn('absolute inset-0 bg-gradient-to-br', vibe.colors)} />
        )}
      </div>

      {/* Color tint */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          vibe.colors,
          'opacity-50 transition-opacity duration-300 group-hover:opacity-55',
        )}
      />
      {/* Bottom fade for text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col p-5">
        <span className="mb-2 origin-bottom-left text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
          {vibe.emoji}
        </span>
        <h2 className="mb-1 text-lg leading-snug font-bold text-white drop-shadow">{vibe.name}</h2>
        <p className="line-clamp-2 text-xs leading-relaxed font-medium text-white/65">
          {vibe.description}
        </p>
      </div>

      {/* Poster dots */}
      {posters.length > 1 && (
        <div className="absolute top-3 right-3 flex gap-1">
          {posters.map((_, i) => (
            <span
              key={i}
              className={cn(
                'block h-1 rounded-full transition-all duration-500',
                i === activeIdx ? 'w-4 bg-white' : 'w-1 bg-white/40',
              )}
            />
          ))}
        </div>
      )}
    </Link>
  )
}
