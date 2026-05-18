'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { submitRatingAction } from '@/lib/actions/user'

interface StarRatingProps {
  movieId: string
  initialAvg?: number | null
  initialCount?: number | null
  initialUserRating?: number | null
  isAuthenticated: boolean
}

export function StarRating({
  movieId,
  initialAvg = null,
  initialCount = 0,
  initialUserRating = null,
  isAuthenticated,
}: StarRatingProps) {
  const [avg, setAvg] = useState<number | null>(initialAvg)
  const [count, setCount] = useState<number>(initialCount || 0)
  const [userRating, setUserRating] = useState<number | null>(initialUserRating)
  const [hover, setHover] = useState<number | null>(null)

  const { execute, isExecuting } = useAction(submitRatingAction, {
    onSuccess: ({ data }) => {
      const submittedRating = data?.rating

      if (data?.success && typeof submittedRating === 'number') {
        // optimistic: update local state. Backend revalidation will ensure final consistency
        setUserRating(submittedRating)
        // update aggregate locally (simple approximation)
        const total = count * (avg || 0)
        const newCount = userRating ? count : count + 1
        const newTotal = total - (userRating || 0) + submittedRating
        setCount(newCount)
        setAvg(newTotal / newCount)
      }
    },
  })

  const handleClick = (value: number) => {
    if (!isAuthenticated) {
      // redirect handled by parent (UserActions) or let the action return not authenticated
      return
    }
    execute({ movieId, rating: value })
  }

  const displayValue = hover ?? userRating ?? Math.round((avg || 0) * 2) / 2

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            aria-label={`Avaliar ${i} estrelas`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => handleClick(i)}
            className={`transition-colors duration-150 focus:outline-none ${
              displayValue >= i ? 'text-yellow-400' : 'text-zinc-600'
            } ${isExecuting ? 'opacity-60' : 'opacity-100'}`}
          >
            <Star className="h-5 w-5" />
          </button>
        ))}
      </div>

      <div className="text-sm text-zinc-300">
        {avg ? (
          <span>
            <strong className="text-white">{avg.toFixed(1)}</strong> / 5 •{' '}
            <span className="opacity-70">{count} avaliações</span>
          </span>
        ) : (
          <span className="opacity-70">Sem avaliações • Seja o primeiro</span>
        )}
      </div>
    </div>
  )
}
