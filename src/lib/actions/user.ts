'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { actionClient } from '@/lib/safe-action'
import { revalidatePath } from 'next/cache'

// ----- Toggles -----

export const toggleFavoriteAction = actionClient
  .schema(z.object({ movieId: z.string().uuid(), isFavorite: z.boolean() }))
  .action(async ({ parsedInput: { movieId, isFavorite } }) => {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, message: 'Usuário não autenticado' }
    }

    if (isFavorite) {
      // Remover
      const { error } = await (supabase as any)
        .from('user_favorites')
        .delete()
        .match({ user_id: user.id, movie_id: movieId })

      if (error) return { success: false, message: error.message }
    } else {
      // Adicionar
      const { error } = await (supabase as any)
        .from('user_favorites')
        .insert({ user_id: user.id, movie_id: movieId })

      if (error) return { success: false, message: error.message }
    }

    revalidatePath(`/filme/${movieId}`)
    revalidatePath('/favoritos')
    return { success: true, isFavorite: !isFavorite }
  })

export const toggleWatchlistAction = actionClient
  .schema(z.object({ movieId: z.string().uuid(), inWatchlist: z.boolean() }))
  .action(async ({ parsedInput: { movieId, inWatchlist } }) => {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, message: 'Usuário não autenticado' }
    }

    if (inWatchlist) {
      // Remover
      const { error } = await (supabase as any)
        .from('user_watchlist')
        .delete()
        .match({ user_id: user.id, movie_id: movieId })

      if (error) return { success: false, message: error.message }
    } else {
      // Adicionar
      const { error } = await (supabase as any)
        .from('user_watchlist')
        .insert({ user_id: user.id, movie_id: movieId, watched: false })

      if (error) return { success: false, message: error.message }
    }

    revalidatePath(`/filme/${movieId}`)
    revalidatePath('/watchlist')
    return { success: true, inWatchlist: !inWatchlist }
  })

export const toggleWatchedAction = actionClient
  .schema(z.object({ movieId: z.string().uuid(), watched: z.boolean() }))
  .action(async ({ parsedInput: { movieId, watched } }) => {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, message: 'Usuário não autenticado' }
    }

    const { error } = await (supabase as any)
      .from('user_watchlist')
      .update({ watched: !watched })
      .match({ user_id: user.id, movie_id: movieId })

    if (error) return { success: false, message: error.message }

    revalidatePath('/watchlist')
    return { success: true, watched: !watched }
  })

// ----- Consultas Iniciais -----

export const checkUserInteractionsAction = actionClient
  .schema(z.object({ movieId: z.string().uuid() }))
  .action(async ({ parsedInput: { movieId } }) => {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { isFavorite: false, inWatchlist: false, watched: false, isAuthenticated: false }
    }

    // Buscar favorito
    const { data: favData } = await supabase
      .from('user_favorites')
      .select('movie_id')
      .match({ user_id: user.id, movie_id: movieId })
      .maybeSingle()

    // Buscar watchlist
    const { data: watchData } = await supabase
      .from('user_watchlist')
      .select('movie_id, watched')
      .match({ user_id: user.id, movie_id: movieId })
      .maybeSingle()

    return {
      isAuthenticated: true,
      isFavorite: !!favData,
      inWatchlist: !!watchData,
      watched: (watchData as any)?.watched || false,
    }
  })

// ----- Discovery (Tinder Swipe) -----

export const getDiscoveryMoviesAction = actionClient.action(async () => {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, message: 'Usuário não autenticado', movies: [] }
  }

  // Chama a RPC criada na migration para buscar os filmes não interagidos
  const { data: movies, error } = await (supabase as any).rpc('get_discovery_movies', {
    p_user_id: user.id,
    p_limit: 10,
  })

  if (error) {
    return { success: false, message: error.message, movies: [] }
  }

  return { success: true, movies: movies || [] }
})

export const recordSwipeAction = actionClient
  .schema(z.object({ movieId: z.string().uuid(), direction: z.enum(['left', 'right']) }))
  .action(async ({ parsedInput: { movieId, direction } }) => {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, message: 'Usuário não autenticado' }
    }

    if (direction === 'right') {
      // Adicionar à Watchlist
      const { error } = await (supabase as any)
        .from('user_watchlist')
        .insert({ user_id: user.id, movie_id: movieId, watched: false })

      // Ignora erro se já existir (conflito)
      if (error && error.code !== '23505') {
        return { success: false, message: error.message }
      }
    } else {
      // Registrar no user_dislikes
      const { error } = await (supabase as any)
        .from('user_dislikes')
        .insert({ user_id: user.id, movie_id: movieId })

      // Ignora erro se já existir
      if (error && error.code !== '23505') {
        return { success: false, message: error.message }
      }
    }

    return { success: true, direction }
  })

// ----- User Rating -----

export const submitRatingAction = actionClient
  .schema(z.object({ movieId: z.string().uuid(), rating: z.number().int().min(1).max(5) }))
  .action(async ({ parsedInput: { movieId, rating } }) => {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, message: 'Usuário não autenticado' }
    }

    const { error } = await (supabase as any)
      .from('user_ratings')
      .upsert({ user_id: user.id, movie_id: movieId, rating }, { onConflict: 'user_id,movie_id' })

    if (error) return { success: false, message: error.message }

    // Revalidate paths that show ratings
    revalidatePath(`/filme/${movieId}`)
    revalidatePath('/descobrir')

    return { success: true, rating }
  })
