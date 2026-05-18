import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runSync } from '@/lib/sync/sync-runner'

// Força a execução dinâmica, pois é um cron
export const dynamic = 'force-dynamic'
// Tempo máximo de execução de 5 minutos (limite para planos pro/hobby no Vercel)
export const maxDuration = 300

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Verifica a autorização (Vercel Cron envia um Bearer token se configurado,
    // ou validamos manualmente se chamado via HTTP)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const startedAt = Date.now()

    console.log('Cron Job: Iniciando sincronização do catálogo...')
    const { processed, skipped, errors } = await runSync(supabase)
    const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1)

    console.log(
      `Cron Job: Sync finalizado! ${processed} processados, ${skipped} pulados, ${errors} erros em ${durationSec}s.`,
    )

    return NextResponse.json({
      success: true,
      stats: { processed, skipped, errors },
      durationSec,
    })
  } catch (error) {
    console.error('Cron Job Error:', error)
    return NextResponse.json({ error: 'Failed to run sync' }, { status: 500 })
  }
}
