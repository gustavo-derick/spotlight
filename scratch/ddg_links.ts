import * as cheerio from 'cheerio'

async function test() {
  const query = 'onde assistir filme oppenheimer'
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  const html = await res.text()
  const $ = cheerio.load(html)

  const providers = new Set<string>()

  $('a.result__url').each((i, el) => {
    const href = $(el).attr('href') || ''
    const text = $(el).text().toLowerCase()

    if (text.includes('netflix.com')) providers.add('Netflix')
    if (text.includes('primevideo.com') || text.includes('amazon.com')) providers.add('Prime Video')
    if (text.includes('max.com') || text.includes('hbomax.com')) providers.add('Max')
    if (text.includes('disneyplus.com')) providers.add('Disney+')
    if (text.includes('apple.com/br/tv')) providers.add('Apple TV+')
  })

  console.log('Found providers via URLs:', Array.from(providers))
}

test().catch(console.error)
