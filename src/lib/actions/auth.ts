'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { actionClient } from '@/lib/safe-action'
import { clientEnv } from '@/env'

// Schema
const signInSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
})

// Precisamos ter o actionClient configurado em `src/lib/safe-action.ts`
// Se não existir, vou criá-lo daqui a pouco.
export const signInWithEmailAction = actionClient
  .schema(signInSchema)
  .action(async ({ parsedInput: { email } }) => {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Redireciona de volta para o app. (NEXT_PUBLIC_APP_URL configurado na ENV local)
        emailRedirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/callback`,
      },
    })

    if (error) {
      return { success: false, message: error.message }
    }

    return { success: true, message: 'Check your email for the login link!' }
  })

// Login OAuth não usa Next Safe Action de forma típica pois redireciona,
// mas podemos usar para retornar a URL de login do provedor.
export const getOAuthUrlAction = actionClient
  .schema(z.object({ provider: z.enum(['google', 'github']) }))
  .action(async ({ parsedInput: { provider } }) => {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/callback`,
      },
    })

    if (error) {
      return { success: false, url: null, message: error.message }
    }

    // Retornamos a URL para o cliente fazer o window.location.assign ou useRouter
    return { success: true, url: data.url, message: '' }
  })
