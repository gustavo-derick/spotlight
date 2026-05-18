'use server'

import { actionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const collectionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
})

export const createCollectionAction = actionClient
  .schema(collectionSchema)
  .action(async ({ parsedInput: { name, description, isPublic } }) => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Não autorizado')
    }

    const { data, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name,
        description,
        is_public: isPublic,
      } as any)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao criar coleção: ' + error.message)
    }

    revalidatePath('/colecoes')
    return { success: true, collection: data as any }
  })

const modifyCollectionSchema = z.object({
  collectionId: z.string().uuid('ID inválido'),
  movieId: z.string().uuid('ID inválido'),
})

export const addMovieToCollectionAction = actionClient
  .schema(modifyCollectionSchema)
  .action(async ({ parsedInput: { collectionId, movieId } }) => {
    const supabase = await createClient()

    // O RLS cuidará de verificar se o usuário é dono ou colaborador
    const { error } = await supabase.from('collection_movies').insert({
      collection_id: collectionId,
      movie_id: movieId,
    } as any)

    if (error) {
      if (error.code === '23505') {
        return { success: true, message: 'Filme já está na coleção' }
      }
      throw new Error('Erro ao adicionar filme: ' + error.message)
    }

    revalidatePath(`/colecoes/${collectionId}`)
    return { success: true }
  })

export const removeMovieFromCollectionAction = actionClient
  .schema(modifyCollectionSchema)
  .action(async ({ parsedInput: { collectionId, movieId } }) => {
    const supabase = await createClient()

    const { error } = await supabase.from('collection_movies').delete().match({
      collection_id: collectionId,
      movie_id: movieId,
    })

    if (error) {
      throw new Error('Erro ao remover filme: ' + error.message)
    }

    revalidatePath(`/colecoes/${collectionId}`)
    return { success: true }
  })

export const deleteCollectionAction = actionClient
  .schema(z.object({ collectionId: z.string().uuid() }))
  .action(async ({ parsedInput: { collectionId } }) => {
    const supabase = await createClient()

    const { error } = await supabase.from('collections').delete().match({ id: collectionId })

    if (error) {
      throw new Error('Erro ao deletar coleção: ' + error.message)
    }

    revalidatePath('/colecoes')
    return { success: true }
  })
