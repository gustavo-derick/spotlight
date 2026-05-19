import Link from 'next/link'
import Image from 'next/image'

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={`mt-auto border-t border-zinc-800/40 bg-black py-8 md:py-12 ${className ?? ''}`}
    >
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row md:px-8">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-spotlight-branca.png"
              alt="Spotlight"
              width={120}
              height={36}
              className="h-7 w-auto opacity-70 transition-opacity hover:opacity-100"
              style={{ filter: 'invert(1)' }}
            />
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
