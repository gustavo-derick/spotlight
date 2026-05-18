'use client'

import { removeMovieFromCollectionAction } from '@/lib/actions/collections'
import { useAction } from 'next-safe-action/hooks'
import { X } from 'lucide-react'

export function RemoveFromCollectionButton({
  collectionId,
  movieId,
}: {
  collectionId: string
  movieId: string
}) {
  const { execute, status } = useAction(removeMovieFromCollectionAction)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        execute({ collectionId, movieId })
      }}
      disabled={status === 'executing'}
      className="rounded-full bg-black/60 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-rose-600"
      aria-label="Remover da coleção"
    >
      <X className="h-4 w-4" />
    </button>
  )
}
