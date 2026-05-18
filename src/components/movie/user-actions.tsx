'use client'

import { useState } from 'react'
import { Heart, BookmarkPlus, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAction } from 'next-safe-action/hooks'
import { toggleFavoriteAction, toggleWatchlistAction } from '@/lib/actions/user'
import { useRouter } from 'next/navigation'
import { AddToCollectionButton } from '@/components/collections/add-to-collection-button'

interface UserActionsProps {
  movieId: string
  initialFavorite: boolean
  initialWatchlist: boolean
  isAuthenticated: boolean
}

export function UserActions({
  movieId,
  initialFavorite,
  initialWatchlist,
  isAuthenticated,
}: UserActionsProps) {
  const router = useRouter()

  const [isFav, setIsFav] = useState(initialFavorite)
  const [inWatch, setInWatch] = useState(initialWatchlist)

  const { execute: executeFavorite, isExecuting: isFavLoading } = useAction(toggleFavoriteAction, {
    onSuccess: ({ data }) => {
      if (data?.success) setIsFav(data.isFavorite ?? isFav)
    },
  })

  const { execute: executeWatchlist, isExecuting: isWatchLoading } = useAction(
    toggleWatchlistAction,
    {
      onSuccess: ({ data }) => {
        if (data?.success) setInWatch(data.inWatchlist ?? inWatch)
      },
    },
  )

  const handleAction = (action: 'favorite' | 'watchlist') => {
    if (!isAuthenticated) {
      router.push('/entrar?error=Você precisa estar logado para interagir')
      return
    }

    if (action === 'favorite') {
      setIsFav(!isFav) // optimistic UI
      executeFavorite({ movieId, isFavorite: isFav })
    } else {
      setInWatch(!inWatch) // optimistic UI
      executeWatchlist({ movieId, inWatchlist: inWatch })
    }
  }

  return (
    <div className="flex gap-3 pt-4">
      <Button
        variant="secondary"
        onClick={() => handleAction('favorite')}
        disabled={isFavLoading}
        className={`backdrop-blur-md transition-colors ${
          isFav
            ? 'border border-rose-500/50 bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'
            : 'bg-zinc-800/80 text-white hover:bg-zinc-700'
        }`}
      >
        {isFavLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`mr-2 h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
        )}
        {isFav ? 'Favoritado' : 'Favoritar'}
      </Button>

      <Button
        variant="secondary"
        onClick={() => handleAction('watchlist')}
        disabled={isWatchLoading}
        className={`backdrop-blur-md transition-colors ${
          inWatch
            ? 'border border-indigo-500/50 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
            : 'bg-zinc-800/80 text-white hover:bg-zinc-700'
        }`}
      >
        {isWatchLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : inWatch ? (
          <Check className="mr-2 h-4 w-4" />
        ) : (
          <BookmarkPlus className="mr-2 h-4 w-4" />
        )}
        {inWatch ? 'Na Watchlist' : 'Watchlist'}
      </Button>

      <AddToCollectionButton movieId={movieId} isAuthenticated={isAuthenticated} />
    </div>
  )
}
