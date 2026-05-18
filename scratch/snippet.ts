import * as cheerio from 'cheerio'

async function testRatings(title: string, year: string) {
  const query = `site:imdb.com "${title}" (${year})`
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  const html = await res.text()
  const $ = cheerio.load(html)

  $('.result').each((_, el) => {
    const snippet = $(el).find('.result__snippet').text()
    console.log('Snippet:', snippet)
  })
}

testRatings('Oppenheimer', '2023').catch(console.error)
