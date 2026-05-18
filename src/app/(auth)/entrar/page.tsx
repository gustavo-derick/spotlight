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
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => executeOAuth({ provider: 'google' })}
                disabled={isOAuthLoading}
                className="flex items-center gap-2 border-none bg-white font-medium text-black hover:bg-zinc-200"
              >
                {isOAuthLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
                Continuar com Google
              </Button>
              <Button
                variant="outline"
                onClick={() => executeOAuth({ provider: 'github' })}
                disabled={isOAuthLoading}
                className="flex items-center gap-2 border-zinc-800 bg-transparent text-white hover:bg-zinc-900"
              >
                {isOAuthLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                )}
                Continuar com GitHub
              </Button>
            </div>

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
