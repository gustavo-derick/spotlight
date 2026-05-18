import { VIBES } from '@/config/vibes'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Vibes | Spotlight',
  description: 'Descubra filmes baseados no seu humor e estado de espírito.',
}

export default function VibesPage() {
  return (
    <main className="container mx-auto flex flex-col items-center px-4 py-12 md:py-20">
      <div className="mb-12 max-w-2xl text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Sparkles className="h-8 w-8 text-yellow-400" />
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">Vibes</h1>
        </div>
        <p className="text-lg text-zinc-400">
          Como você está se sentindo hoje? Escolha o seu estado de espírito e nós encontramos os
          filmes perfeitos para o momento.
        </p>
      </div>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {VIBES.map((vibe) => (
          <Link
            key={vibe.slug}
            href={`/vibes/${vibe.slug}`}
            className="group relative overflow-hidden rounded-3xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Fundo Gradiente */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${vibe.colors} opacity-80 transition-opacity group-hover:opacity-100`}
            />

            {/* Conteúdo */}
            <div className="relative flex h-full min-h-[240px] flex-col justify-end p-8">
              <span className="mb-4 origin-bottom-left transform text-5xl transition-transform group-hover:scale-110 group-hover:-rotate-6">
                {vibe.emoji}
              </span>
              <h2 className="mb-2 text-2xl font-bold text-white shadow-sm drop-shadow-md">
                {vibe.name}
              </h2>
              <p className="font-medium text-white/80">{vibe.description}</p>
            </div>

            {/* Brilho hover */}
            <div className="absolute inset-0 bg-white opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-20" />
          </Link>
        ))}
      </div>
    </main>
  )
}
