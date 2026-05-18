import * as cheerio from 'cheerio'

async function testRatings(title: string, year: string) {
  const query = `site:imdb.com OR site:rottentomatoes.com OR site:letterboxd.com/film/ "${title}" ${year}`
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    },
  })
  const html = await res.text()
  const $ = cheerio.load(html)

  let imdb: string | null = null
  let rt: string | null = null
  let lb: string | null = null

  $('.result').each((_, el) => {
    const snippet = $(el).find('.result__snippet').text().toLowerCase()
    const href = $(el).find('.result__url').attr('href') || ''

    // Decodificar URL do DDG se necessário, mas o href na versão html geralmente é o real ou redirect.
    const urlText = $(el).find('.result__url').text().toLowerCase()

    if (urlText.includes('imdb.com/title/') && !imdb) {
      // Snippet often contains: "Rating: 8.4/10 · 1.2M votes"
      const match = snippet.match(/rating:\s*(\d[\d\.]+)\/10/i) || snippet.match(/(\d[\d\.]+)\/10/)
      if (match) imdb = match[1]
    }

    if (urlText.includes('rottentomatoes.com/m/') && !rt) {
      // Snippet often contains: "Tomatometer: 93%" or "93%"
      const match = snippet.match(/(\d{1,3})%/)
      if (match) rt = match[1]
    }

    if (urlText.includes('letterboxd.com/film/') && !lb) {
      // Snippet often contains: "3.9/5" or similar
      const match = snippet.match(/(\d[\d\.]+)\/5/)
      if (match) lb = match[1]
    }
  })

  console.log('Results for', title, ':', { imdb, rt, lb })
}

testRatings('Oppenheimer', '2023')
  .then(() => testRatings('The Dark Knight', '2008'))
  .catch(console.error)
