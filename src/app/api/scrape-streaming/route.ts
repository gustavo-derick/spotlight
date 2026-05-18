import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export const dynamic = 'force-dynamic' // Nunca guardar cache na API (vamos gerenciar no front/banco se necessário)

// Mapeamento das logos conhecidas para retornar algo visualmente bonito
const PROVIDER_LOGOS: Record<string, string> = {
  Netflix: 'https://logo.clearbit.com/netflix.com',
  'Prime Video': 'https://logo.clearbit.com/primevideo.com',
  Max: 'https://logo.clearbit.com/max.com',
  'Disney+': 'https://logo.clearbit.com/disneyplus.com',
  'Apple TV+': 'https://logo.clearbit.com/apple.com',
  Globoplay: 'https://logo.clearbit.com/globoplay.globo.com',
  'Paramount+': 'https://logo.clearbit.com/paramountplus.com',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title')

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Usando DuckDuckGo versão HTML pura que não bloqueia requests
    const query = `onde assistir filme ${title} online streaming brasil`
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    })

    if (!res.ok) {
      throw new Error(`Busca falhou com status ${res.status}`)
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    const foundProviders = new Set<string>()

    // Analisamos os URLs que aparecem nos resultados de busca do DuckDuckGo
    $('a.result__url').each((_, el) => {
      const text = $(el).text().toLowerCase()

      if (text.includes('netflix.com')) foundProviders.add('Netflix')
      if (text.includes('primevideo.com') || text.includes('amazon.com'))
        foundProviders.add('Prime Video')
      if (text.includes('max.com') || text.includes('hbomax.com')) foundProviders.add('Max')
      if (text.includes('disneyplus.com')) foundProviders.add('Disney+')
      if (text.includes('apple.com/br/tv') || text.includes('tv.apple.com'))
        foundProviders.add('Apple TV+')
      if (text.includes('globoplay.globo.com')) foundProviders.add('Globoplay')
      if (text.includes('paramountplus.com')) foundProviders.add('Paramount+')
    })

    // Formatar a resposta no mesmo padrão que a interface espera
    const results = Array.from(foundProviders).map((provider) => ({
      provider_name: provider,
      provider_logo_url: PROVIDER_LOGOS[provider] || '',
      type: 'flatrate',
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json({ error: 'Failed to scrape' }, { status: 500 })
  }
}
