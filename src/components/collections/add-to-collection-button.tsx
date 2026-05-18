'use client'

import { useState, useEffect } from 'react'
import { FolderPlus, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { addMovieToCollectionAction } from '@/lib/actions/collections'
import { useAction } from 'next-safe-action/hooks'

interface AddToCollectionButtonProps {
  movieId: string
  isAuthenticated: boolean
}

export function AddToCollectionButton({ movieId, isAuthenticated }: AddToCollectionButtonProps) {
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addedTo, setAddedTo] = useState<string | null>(null)

  const { execute, status } = useAction(addMovieToCollectionAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        // Marcamos como adicionado por uns segundos para feedback
        setTimeout(() => setAddedTo(null), 2000)
      }
    },
  })

  // Carregar coleções ao abrir o modal
  useEffect(() => {
    if (open && isAuthenticated) {
      loadCollections()
    }
  }, [open, isAuthenticated])

  const loadCollections = async () => {
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Buscar coleções do usuário (ou que ele seja colaborador)
      // Simplificado: buscando onde user_id = user.id
      const { data } = await supabase
        .from('collections')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setCollections(data)
      }
    }
    setLoading(false)
  }

  const handleAdd = (collectionId: string) => {
    setAddedTo(collectionId)
    execute({ collectionId, movieId })
  }

  if (!isAuthenticated) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="secondary"
            className="bg-zinc-800/80 text-white backdrop-blur-md transition-colors hover:bg-zinc-700"
          />
        }
      >
        <FolderPlus className="mr-2 h-4 w-4" />
        Salvar
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-white sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Salvar em uma coleção</DialogTitle>
        </DialogHeader>

        <div className="max-h-[300px] space-y-2 overflow-y-auto py-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : collections.length > 0 ? (
            collections.map((c) => (
              <button
                key={c.id}
                onClick={() => handleAdd(c.id)}
                className="flex w-full items-center justify-between rounded-md p-3 text-left transition-colors hover:bg-zinc-800"
              >
                <span className="font-medium text-zinc-200">{c.name}</span>
                {addedTo === c.id || (status === 'executing' && addedTo === c.id) ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <FolderPlus className="h-4 w-4 text-zinc-500 opacity-0 group-hover:opacity-100" />
                )}
              </button>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-zinc-500">
              Você ainda não tem coleções. <br /> Vá em "Minhas Coleções" para criar uma.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
