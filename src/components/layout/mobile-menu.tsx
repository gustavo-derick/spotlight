'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Bookmark,
  Clapperboard,
  Flame,
  Heart,
  Menu,
  Search,
  Sparkles,
  TrendingUp,
  UserCircle,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DynamicSearch } from '@/components/search/dynamic-search'
import { cn } from '@/lib/utils'

type MobileNavItem = {
  href: string
  label: string
  icon: LucideIcon
  activeClass: string
  iconClass: string
  authOnly?: boolean
}

const navItems: MobileNavItem[] = [
  {
    href: '/vibes',
    label: 'Vibes',
    icon: Sparkles,
    activeClass: 'border-yellow-400 bg-yellow-400/10 text-white',
    iconClass: 'text-yellow-400',
  },
  {
    href: '/descobrir',
    label: 'Descobrir',
    icon: Flame,
    activeClass: 'border-rose-500 bg-rose-500/10 text-white',
    iconClass: 'text-rose-400',
  },
  {
    href: '/lancamentos',
    label: 'Lançamentos',
    icon: Clapperboard,
    activeClass: 'border-sky-400 bg-sky-400/10 text-white',
    iconClass: 'text-sky-400',
  },
  {
    href: '/populares',
    label: 'Populares',
    icon: TrendingUp,
    activeClass: 'border-orange-400 bg-orange-400/10 text-white',
    iconClass: 'text-orange-400',
  },
  {
    href: '/busca',
    label: 'Busca',
    icon: Search,
    activeClass: 'border-cyan-400 bg-cyan-400/10 text-white',
    iconClass: 'text-cyan-400',
  },
  {
    href: '/favoritos',
    label: 'Favoritos',
    icon: Heart,
    activeClass: 'border-red-400 bg-red-400/10 text-white',
    iconClass: 'text-red-400',
    authOnly: true,
  },
  {
    href: '/watchlist',
    label: 'Watchlist',
    icon: Bookmark,
    activeClass: 'border-emerald-400 bg-emerald-400/10 text-white',
    iconClass: 'text-emerald-400',
    authOnly: true,
  },
  {
    href: '/perfil',
    label: 'Perfil',
    icon: UserCircle,
    activeClass: 'border-zinc-200 bg-white/10 text-white',
    iconClass: 'text-zinc-100',
    authOnly: true,
  },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MobileMenu({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  const visibleItems = navItems.filter((item) => isAuthenticated || !item.authOnly)

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((current) => !current)}
        className="rounded-full text-zinc-300 hover:bg-zinc-800 hover:text-white"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-x-0 top-16 bottom-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />

          <div
            id="mobile-navigation"
            className="fixed inset-x-0 top-16 z-40 border-b border-zinc-800 bg-zinc-950/95 shadow-2xl md:hidden"
          >
            <div className="mx-auto max-h-[calc(100dvh-4rem)] max-w-screen-sm overflow-y-auto px-4 py-4">
              <DynamicSearch className="max-w-none" />

              <nav className="mt-4 grid gap-2" aria-label="Navegação mobile">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(pathname, item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex h-12 items-center gap-3 border-l-2 border-zinc-800 bg-zinc-900/60 px-4 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-900 hover:text-white',
                        active && item.activeClass,
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 text-zinc-500 transition-colors group-hover:text-zinc-300',
                          active && item.iconClass,
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
