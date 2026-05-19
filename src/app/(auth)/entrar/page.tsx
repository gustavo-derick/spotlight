'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clapperboard, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useAction } from 'next-safe-action/hooks'
import { signInWithEmailAction, getOAuthUrlAction } from '@/lib/actions/auth'

export default function EntrarPage() {
  const [email, setEmail] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { execute: executeEmail, isExecuting: isEmailLoading } = useAction(signInWithEmailAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        setSuccessMsg('Verifique seu e-mail para o link mágico de login!')
      } else {
        alert(data?.message || 'Erro ao enviar e-mail.')
      }
    },
    onError: ({ error }) => {
      alert(error.serverError || 'Ocorreu um erro no servidor.')
    },
  })

  const { execute: executeOAuth, isExecuting: isOAuthLoading } = useAction(getOAuthUrlAction, {
    onSuccess: ({ data }) => {
      if (data?.success && data.url) {
        window.location.assign(data.url)
      } else {
        alert(data?.message || 'Erro ao inicializar OAuth.')
      }
    },
  })

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg('')
    executeEmail({ email })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black px-4 py-12">
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo / Brand Header */}
        <div className="mb-8 flex flex-col items-center justify-center space-y-2 text-center">
          <div className="mb-2 rounded-full bg-white/10 p-3 ring-1 ring-white/20">
            <Clapperboard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-white">Spotlight</h1>
          <p className="text-sm text-zinc-400">Sua plataforma definitiva de descoberta de filmes</p>
        </div>

        <Card className="border-zinc-800 bg-zinc-950/50 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Faça login para gerenciar sua watchlist e favoritos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OAuth Buttons */}
            <button
              type="button"
              onClick={() => executeOAuth({ provider: 'google' })}
              disabled={isOAuthLoading}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-lg shadow-black/30 transition-all duration-200 hover:scale-[1.015] hover:shadow-xl hover:shadow-black/40 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
            >
              {isOAuthLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
              )}
              <span>Continuar com Google</span>
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5 ring-inset" />
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-950 px-2 text-zinc-500">ou entre com e-mail</span>
              </div>
            </div>

            {/* Email Form */}
            {successMsg ? (
              <div className="space-y-2 rounded-md border border-green-500/20 bg-zinc-900/50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
                <p className="text-sm font-medium text-green-400">{successMsg}</p>
                <p className="text-xs text-zinc-500">Você pode fechar esta aba com segurança.</p>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    disabled={isEmailLoading}
                    className="border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-700"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isEmailLoading}
                  className="w-full bg-white font-medium text-black hover:bg-zinc-200"
                >
                  {isEmailLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Enviar Magic Link
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-4 text-sm text-zinc-400">
            <p className="text-center text-sm">
              Ao continuar, você concorda com nossos{' '}
              <Link
                href="/termos"
                className="underline underline-offset-4 transition-colors hover:text-white"
              >
                Termos de Serviço
              </Link>{' '}
              e{' '}
              <Link
                href="/privacidade"
                className="underline underline-offset-4 transition-colors hover:text-white"
              >
                Política de Privacidade
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Background ambient light */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[25%] -left-[10%] h-[50%] w-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[40%] w-[40%] rounded-full bg-rose-500/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] h-[60%] w-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>
    </div>
  )
}
