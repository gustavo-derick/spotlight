/**
 * bulk-sync.ts — Sincronização em massa de filmes via TMDB /discover/movie
 *
 * Estratégia:
 *  - Para cada ano de 2000 a 2025, busca todas as páginas do /discover/movie
 *    filtrado por vote_count >= 200 (garante filmes relevantes, ~150-300 por ano)
 *  - Ordena por popularidade decrescente (blockbusters primeiro)
 *  - Usa processMovie() do sync-runner já existente (upsert seguro)
 *  - Executa em concorrência de 3 filmes por vez para respeitar rate limits
 *
 * Uso:
 *   TMDB_API_KEY=... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/bulk-sync.ts
 */

import { createClient } from '@supabase/supabase-js'
import { processMovie } from '../src/lib/sync/sync-runner'

// ─── Config ───────────────────────────────────────────────────────────────────

const TMDB_BASE = 'https://api.themoviedb.org/3'
const CONCURRENCY = 3 // conservador para evitar rate limit da TMDB
const START_YEAR = 2000
const END_YEAR = new Date().getFullYear()
const MIN_VOTE_COUNT = 100 // mínimo de votos para garantir relevância
const DELAY_BETWEEN_PAGES_MS = 250 // 250ms entre páginas para ser gentil com a API

// ─── Helper ───────────────────────────────────────────────────────────────────

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY!
  const url = new URL(TMDB_BASE + path)
  url.searchParams.set('language', 'pt-BR')

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (apiKey.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${apiKey}`
  } else {
    url.searchParams.set('api_key', apiKey)
  }
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

interface DiscoverPage {
  results: { id: number }[]
  total_pages: number
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Coleta todos os tmdb_ids de um determinado ano via /discover/movie
 */
async function collectIdsForYear(year: number): Promise<number[]> {
  const ids = new Set<number>()
  let page = 1
  let totalPages = 1

  do {
    try {
      const data = await tmdbGet<DiscoverPage>('/discover/movie', {
        primary_release_year: String(year),
        sort_by: 'popularity.desc',
        'vote_count.gte': String(MIN_VOTE_COUNT),
        page: String(page),
        region: 'BR',
      })
      for (const movie of data.results) ids.add(movie.id)
      totalPages = Math.min(data.total_pages, 20) // cap em 20 páginas (400 filmes) por ano
      page++
      if (page <= totalPages) await sleep(DELAY_BETWEEN_PAGES_MS)
    } catch (err) {
      console.warn(`  ⚠ Erro página ${page} de ${year}:`, err instanceof Error ? err.message : err)
      break
    }
  } while (page <= totalPages)

  return [...ids]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  console.log(`\n🎬 Bulk Sync: filmes de ${START_YEAR} a ${END_YEAR}`)
  console.log(`   Filtro: vote_count >= ${MIN_VOTE_COUNT}, top 20 páginas por ano\n`)

  let totalProcessed = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (let year = END_YEAR; year >= START_YEAR; year--) {
    console.log(`\n📅 Ano ${year}...`)
    const ids = await collectIdsForYear(year)
    console.log(`   → ${ids.length} filmes encontrados`)

    let yearProcessed = 0
    let yearSkipped = 0
    let yearErrors = 0

    // Processa em lotes de CONCURRENCY
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const batch = ids.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(
        batch.map((id) => processMovie(supabase, id, true)), // skipRatings=true para ser rápido
      )
      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value === 'processed') yearProcessed++
          else if (r.value === 'skipped') yearSkipped++
          else yearErrors++
        } else {
          yearErrors++
        }
      }
      // Progresso
      process.stdout.write(
        `\r   ✔ ${yearProcessed} processados, ${yearSkipped} pulados, ${yearErrors} erros`,
      )
    }

    console.log(`\n   ✅ ${year} concluído: ${yearProcessed}p / ${yearSkipped}s / ${yearErrors}e`)
    totalProcessed += yearProcessed
    totalSkipped += yearSkipped
    totalErrors += yearErrors

    // Pausa leve entre anos para não bater rate limit
    await sleep(500)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`🏁 Sync concluído!`)
  console.log(`   Processados: ${totalProcessed}`)
  console.log(`   Pulados:     ${totalSkipped}`)
  console.log(`   Erros:       ${totalErrors}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
