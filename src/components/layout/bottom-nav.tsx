'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', icon: Home, label: 'Início', exact: true },
  { href: '/busca', icon: Search, label: 'Buscar', exact: false },
  { href: '/vibes', icon: Sparkles, label: 'Vibes', exact: false },
  { href: '/perfil', icon: User, label: 'Perfil', exact: false },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800/60 bg-zinc-950/95 backdrop-blur-xl md:hidden">
      <div className="flex h-16 items-stretch">
        {tabs.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150',
                active ? 'text-white' : 'text-zinc-500 active:text-zinc-300',
              )}
            >
              <div
                className={cn(
                  'relative flex items-center justify-center rounded-xl p-1.5 transition-colors duration-150',
                  active && 'bg-white/10',
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'text-white')} />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white" />
                )}
              </div>
              <span
                className={cn('text-[10px] font-medium', active ? 'text-white' : 'text-zinc-500')}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
