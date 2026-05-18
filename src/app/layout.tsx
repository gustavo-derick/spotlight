import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Geist_Mono, Bentham } from 'next/font/google'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-geist-sans', // mantém a mesma variável para não quebrar nada
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const bentham = Bentham({
  variable: '--font-bentham',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: {
    default: 'Spotlight',
    template: '%s | Spotlight',
  },
  description: 'Descubra filmes e séries disponíveis no streaming brasileiro.',
}

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { QueryProvider } from '@/components/query-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakartaSans.variable} ${geistMono.variable} ${bentham.variable} dark h-full antialiased`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <QueryProvider>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  )
}
