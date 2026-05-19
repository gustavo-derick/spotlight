'use client'

import { useMemo, useState } from 'react'
import { Play, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { TmdbEmbeddableVideo } from '@/lib/tmdb/types'

interface TrailerDialogProps {
  trailer: Pick<TmdbEmbeddableVideo, 'key' | 'name' | 'site'>
  movieTitle: string
  className?: string
  label?: string
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
}

function getEmbedUrl(trailer: Pick<TmdbEmbeddableVideo, 'key' | 'site'>) {
  const key = encodeURIComponent(trailer.key)

  if (trailer.site === 'YouTube') {
    return `https://www.youtube-nocookie.com/embed/${key}?rel=0&modestbranding=1&playsinline=1`
  }

  return `https://player.vimeo.com/video/${key}`
}

export function TrailerDialog({
  trailer,
  movieTitle,
  className,
  label = 'Assistir trailer',
  size = 'default',
  variant = 'default',
}: TrailerDialogProps) {
  const [open, setOpen] = useState(false)
  const embedUrl = useMemo(() => getEmbedUrl(trailer), [trailer])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size={size}
            variant={variant}
            className={cn('rounded-full font-semibold', className)}
          />
        }
      >
        <Play className="h-4 w-4 fill-current" />
        {label}
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[95dvh] max-w-[calc(100%-1rem)] overflow-hidden border-zinc-800 bg-black p-0 text-white sm:max-w-4xl"
      >
        <DialogHeader className="flex-row items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-4 py-3">
          <div className="min-w-0">
            <DialogTitle className="line-clamp-1 text-base font-semibold text-white">
              {movieTitle}
            </DialogTitle>
            <DialogDescription className="line-clamp-1 text-xs text-zinc-400">
              {trailer.name}
            </DialogDescription>
          </div>

          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
              />
            }
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Fechar trailer</span>
          </DialogClose>
        </DialogHeader>

        <div className="aspect-video w-full bg-black">
          {open && (
            <iframe
              className="h-full w-full border-0"
              src={embedUrl}
              title={`Trailer de ${movieTitle}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
