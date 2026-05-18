import Link from 'next/link'
import { User, Flame, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { DynamicSearch } from '@/components/search/dynamic-search'
import { LogoIcon } from '@/components/layout/logo-icon'
import { MobileMenu } from '@/components/layout/mobile-menu'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/40 bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
        <Link href="/" className="group logo-container mr-4 flex items-center gap-3 md:mr-8">
          <div className="relative">
            <div className="rounded-xl bg-white/10 p-1.5 ring-1 ring-white/20 transition-all duration-500 group-hover:scale-110 group-hover:bg-white/20 group-hover:ring-white/40">
              <LogoIcon className="h-6 w-6 text-white" />
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
          </div>
          <div className="relative">
            <span
              className="text-xl font-medium tracking-wide text-white md:hidden"
              style={{ fontFamily: 'var(--font-bentham)' }}
            >
              Spotlight
            </span>
            <span
              className="hidden text-2xl font-medium tracking-wide opacity-20 md:inline-block"
              style={{ fontFamily: 'var(--font-bentham)' }}
            >
              Spotlight
            </span>
            <span
              className="logo-spotlight-reveal absolute inset-0 hidden text-2xl font-medium tracking-wide md:inline-block"
              style={{ fontFamily: 'var(--font-bentham)' }}
            >
              Spotlight
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-400 md:flex">
          <Link href="/vibes" className="group relative">
            <span className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-zinc-100/90 transition-colors hover:text-white">
              <Sparkles className="h-4 w-4 text-yellow-400 opacity-90" />
              <span className="tracking-wider">Vibes</span>
            </span>
            {/* bottom accent bar */}
            <span className="absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded bg-transparent transition-all duration-200 group-hover:w-10 group-hover:bg-yellow-400" />
          </Link>

          <Link href="/descobrir" className="group relative">
            <span className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-zinc-100/90 transition-colors hover:text-white">
              <Flame className="h-4 w-4 text-rose-500 opacity-90" />
              <span className="tracking-wider">Descobrir</span>
            </span>
            <span className="absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded bg-transparent transition-all duration-200 group-hover:w-10 group-hover:bg-rose-500" />
          </Link>

          <Link href="/lancamentos" className="transition-colors hover:text-white">
            Lançamentos
          </Link>
          <Link href="/populares" className="transition-colors hover:text-white">
            Populares
          </Link>

          {session && (
            <>
              <Link href="/favoritos" className="transition-colors hover:text-white">
                Favoritos
              </Link>
              <Link href="/watchlist" className="transition-colors hover:text-white">
                Watchlist
              </Link>
            </>
          )}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="hidden md:flex">
            <DynamicSearch />
          </div>

          <nav className="flex items-center gap-2">
            {session ? (
              <Link href="/perfil">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-800">
                  <User className="h-5 w-5 text-zinc-300" />
                  <span className="sr-only">Perfil</span>
                </Button>
              </Link>
            ) : (
              <Link href="/entrar">
                <Button
                  variant="default"
                  className="rounded-full bg-white px-6 font-medium text-black hover:bg-zinc-200"
                >
                  Entrar
                </Button>
              </Link>
            )}
          </nav>

          <MobileMenu isAuthenticated={!!session} />
        </div>
      </div>
    </header>
  )
}
