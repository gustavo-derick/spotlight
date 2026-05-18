import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const imdbId = searchParams.get('imdbId')

    if (!imdbId || !imdbId.startsWith('tt')) {
      return NextResponse.json({ error: 'Valid IMDb ID is required' }, { status: 400 })
    }

    const apiKey = process.env.RAPIDAPI_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'RapidAPI key not configured' }, { status: 500 })
    }

    const RAPIDAPI_HOST = 'movies-ratings2.p.rapidapi.com'

    // Fazer a busca via API especializada (que atua como web scraper sob o capô,
    // garantindo contorno de bloqueios do Cloudflare que sites como IMDb e Letterboxd possuem).
    const res = await fetch(`https://${RAPIDAPI_HOST}/ratings?id=${imdbId}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': apiKey,
      },
    })

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ results: [] })
      }
      throw new Error(`Scraper API failed with status ${res.status}`)
    }

    const data = await res.json()
    const r = data.ratings
    const results = []

    if (r?.imdb?.score != null) {
      results.push({
        source: 'imdb',
        score: r.imdb.score,
        url: r.imdb.url || `https://www.imdb.com/title/${imdbId}/`,
      })
    }
    if (r?.rotten_tomatoes?.tomatometer != null) {
      results.push({
        source: 'rotten_tomatoes',
        score: r.rotten_tomatoes.tomatometer,
        url: r.rotten_tomatoes.url,
      })
    }
    if (r?.letterboxd?.score != null) {
      results.push({
        source: 'letterboxd',
        score: r.letterboxd.score,
        url: r.letterboxd.url,
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Ratings scraping error:', error)
    return NextResponse.json({ error: 'Failed to scrape ratings' }, { status: 500 })
  }
}
