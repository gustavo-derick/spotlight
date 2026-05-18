import Link from 'next/link'
import { Clapperboard } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800/40 bg-black py-8 md:py-12">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row md:px-8">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-full bg-white/10 p-1.5 ring-1 ring-white/20">
              <Clapperboard className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Spotlight</span>
          </Link>
          <p className="text-sm text-zinc-500">
            Sua plataforma definitiva de descoberta de filmes.
          </p>
        </div>

        <div className="flex gap-4 text-sm text-zinc-400">
          <Link href="/termos" className="transition-colors hover:text-white">
            Termos
          </Link>
          <Link href="/privacidade" className="transition-colors hover:text-white">
            Privacidade
          </Link>
          <Link href="/sobre" className="transition-colors hover:text-white">
            Sobre
          </Link>
        </div>
      </div>
      <div className="container mx-auto mt-8 flex justify-center px-4 text-xs text-zinc-600 md:px-8">
        &copy; {new Date().getFullYear()} Spotlight. Todos os direitos reservados.
      </div>
    </footer>
  )
}
