import { config } from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { processMovie } from '../src/lib/sync/sync-runner'

// Carregar variáveis de ambiente
config({ path: path.resolve(process.cwd(), '.env.local') })

const TMDB_BASE = 'https://api.themoviedb.org/3'
const RETRY_DELAYS = [1000, 3000, 9000]
const CONCURRENCY = 5

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < RETRY_DELAYS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
      }
    }
  }
  throw lastError
}

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY!
  const url = new URL(TMDB_BASE + path)
  url.searchParams.set('language', 'pt-BR')

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (apiKey.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${apiKey}`
  } else {
    url.searchParams.set('api_key', apiKey)
  }

  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`TMDB ${res.status} ${path}`)
  return res.json() as Promise<T>
}

// Coleta agressiva usando discover
async function collectMassiveTmdbIds(): Promise<number[]> {
  // Vamos varrer as 100 primeiras páginas dos filmes mais populares
  const pages = 100 // 100 páginas * 20 = 2000 filmes
  const ids = new Set<number>()

  console.log(`Buscando até ${pages * 20} filmes nas rotas de discovery...`)

  // Busca geral por popularidade (garante blockbusters)
  for (let page = 1; page <= pages; page++) {
    try {
      const data = await withRetry(() =>
        tmdbGet<any>('/discover/movie', {
          page: String(page),
          sort_by: 'primary_release_date.desc',
          'primary_release_date.gte': '2000-01-01',
          'primary_release_date.lte': new Date().toISOString().split('T')[0],
          'vote_count.gte': '1000', // Pelo menos 1000 votos para priorizar blockbusters
        }),
      )
      for (const item of data.results) ids.add(item.id)
      process.stdout.write(`\rPáginas populares: ${page}/${pages} - Total IDs: ${ids.size}`)
    } catch (err) {
      console.warn(`\nErro na página ${page}:`, err)
    }
  }

  console.log('\nColeção de IDs finalizada!')
  return [...ids]
}

async function start() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const startedAt = Date.now()
  console.log('--- INICIANDO DEEP POPULATE ---')

  const tmdbIds = await collectMassiveTmdbIds()
  console.log(`\nVamos processar ${tmdbIds.length} filmes. Isso pode demorar algumas horas.\n`)

  let processed = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < tmdbIds.length; i += CONCURRENCY) {
    const batch = tmdbIds.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(batch.map((id) => processMovie(supabase, id, true)))
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value === 'processed') processed++
        else if (result.value === 'skipped') skipped++
        else errors++
      } else {
        errors++
      }
    }

    // Log de progresso a cada lote
    if ((i + CONCURRENCY) % 50 === 0 || i + CONCURRENCY >= tmdbIds.length) {
      const prog = Math.min(i + CONCURRENCY, tmdbIds.length)
      const percent = ((prog / tmdbIds.length) * 100).toFixed(1)
      console.log(
        `Progresso: ${prog}/${tmdbIds.length} (${percent}%) | Processados: ${processed} | Skipped: ${skipped} | Errors: ${errors}`,
      )
    }
  }

  console.log('\n--- DEEP POPULATE FINALIZADO ---')
  console.log(`Filmes Processados: ${processed}`)
  console.log(`Filmes Ignorados (Sem IMDb ou falha lógica): ${skipped}`)
  console.log(`Erros Críticos: ${errors}`)
  console.log(`Tempo Total: ${((Date.now() - startedAt) / 1000 / 60).toFixed(1)} minutos`)
}

start()
