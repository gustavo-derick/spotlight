import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Função auxiliar para traduzir texto usando a API gratuita do Google Translate
async function translateToPortuguese(text: string): Promise<string> {
  if (!text) return text
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`,
      { cache: 'no-store' },
    )
    const data = await res.json()
    // O retorno é um array de arrays; o índice 0 de cada subarray contém o trecho traduzido
    if (data && data[0] && Array.isArray(data[0])) {
      return data[0].map((item: any) => item[0]).join('')
    }
    return text
  } catch (error) {
    console.error('Translation error:', error)
    return text // Fallback para o texto original se falhar
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tmdbId = searchParams.get('tmdbId')

    if (!tmdbId) {
      return NextResponse.json({ error: 'TMDB ID is required' }, { status: 400 })
    }

    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 })
    }

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    }

    // 1. Tentar buscar avaliações em Português primeiro
    const resPt = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/reviews?language=pt-BR&page=1`,
      options,
    )
    let data = await resPt.json()
    let results = data.results || []
    let needsTranslation = false

    // 2. Se não houver avaliações em português, fazer fallback para Inglês e sinalizar tradução
    if (results.length === 0) {
      const resEn = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbId}/reviews?language=en-US&page=1`,
        options,
      )
      data = await resEn.json()
      results = data.results || []
      needsTranslation = true
    }

    // Mapear os dados para um formato limpo
    const reviews = results.map((r: any) => ({
      id: r.id,
      author: r.author,
      authorDetails: {
        name: r.author_details.name || r.author,
        username: r.author_details.username,
        avatarPath: r.author_details.avatar_path
          ? r.author_details.avatar_path.startsWith('/http')
            ? r.author_details.avatar_path.slice(1)
            : `https://image.tmdb.org/t/p/w200${r.author_details.avatar_path}`
          : null,
        rating: r.author_details.rating,
      },
      content: r.content,
      createdAt: r.created_at,
      url: r.url,
    }))

    // Ordenar por data mais recente e limitar a 6 opiniões
    let topReviews = reviews
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)

    // Se precisou de fallback pro inglês, traduz os conteúdos apenas dos top 6 exibidos (pra ser rápido)
    if (needsTranslation && topReviews.length > 0) {
      topReviews = await Promise.all(
        topReviews.map(async (review: any) => ({
          ...review,
          content: await translateToPortuguese(review.content),
        })),
      )
    }

    return NextResponse.json({ results: topReviews })
  } catch (error) {
    console.error('Movie reviews error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
