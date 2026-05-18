import * as cheerio from 'cheerio'

async function test() {
  const query = 'Oppenheimer'
  const url = `https://html.duckduckgo.com/html/?q=onde+assistir+${encodeURIComponent(query)}`
  console.log('Fetching', url)
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  const html = await res.text()
  const $ = cheerio.load(html)

  const text = $('body').text().toLowerCase()

  const providers = []
  if (text.includes('netflix')) providers.push('Netflix')
  if (text.includes('prime video')) providers.push('Prime Video')
  if (text.includes('hbo max') || text.includes(' max ')) providers.push('Max')
  if (text.includes('disney+')) providers.push('Disney+')

  console.log('Found providers in DDG:', providers)
}

test().catch(console.error)
