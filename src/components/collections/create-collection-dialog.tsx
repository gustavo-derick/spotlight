'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAction } from 'next-safe-action/hooks'
import { createCollectionAction } from '@/lib/actions/collections'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

export function CreateCollectionDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  const router = useRouter()
  const { execute, status } = useAction(createCollectionAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        setOpen(false)
        setName('')
        setDescription('')
        setIsPublic(false)
        // Redireciona para a página da nova coleção
        const newCollection = data.collection as any
        if (newCollection?.id) {
          router.push(`/colecoes/${newCollection.id}`)
        }
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    execute({ name, description, isPublic })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-white text-black hover:bg-zinc-200" />}>
        <Plus className="mr-2 h-4 w-4" />
        Nova Coleção
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Coleção</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Crie uma lista personalizada para guardar ou compartilhar seus filmes favoritos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nome da Coleção
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Top Terror"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:ring-2 focus:ring-white/20 focus:outline-none"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="desc" className="text-sm font-medium">
              Descrição (Opcional)
            </label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Filmes para assistir no escuro..."
              className="h-20 w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:ring-2 focus:ring-white/20 focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-800 text-rose-500 focus:ring-rose-500"
            />
            <label htmlFor="isPublic" className="cursor-pointer text-sm leading-none font-medium">
              Tornar pública
            </label>
          </div>
          <p className="pl-6 text-xs text-zinc-500">
            Coleções públicas podem ser acessadas por qualquer um com o link.
          </p>
          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={status === 'executing' || !name.trim()}
              className="w-full bg-rose-600 text-white hover:bg-rose-700"
            >
              {status === 'executing' ? 'Criando...' : 'Criar Coleção'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
