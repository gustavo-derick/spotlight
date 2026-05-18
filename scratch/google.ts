import * as cheerio from 'cheerio'

async function test() {
  const query = 'Oppenheimer'
  const url = `https://www.google.com/search?q=onde+assistir+${encodeURIComponent(query)}`
  console.log('Fetching', url)
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  const html = await res.text()
  const $ = cheerio.load(html)

  // Find streaming providers
  // Google usually puts them in divs with class or aria-labels
  const providers: string[] = []

  $('*').each((i, el) => {
    const text = $(el).text()
    if (
      text === 'Prime Video' ||
      text === 'Netflix' ||
      text === 'Max' ||
      text === 'Disney+' ||
      text === 'Apple TV'
    ) {
      providers.push(text)
    }
  })

  console.log(providers)
}

test().catch(console.error)
