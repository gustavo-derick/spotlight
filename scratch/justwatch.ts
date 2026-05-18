import * as cheerio from 'cheerio'

async function test() {
  const query = 'Oppenheimer'
  const url = `https://www.justwatch.com/br/busca?q=${encodeURIComponent(query)}`
  console.log('Fetching', url)
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  const html = await res.text()
  const $ = cheerio.load(html)

  // They use __URQL_DATA__ or __NEXT_DATA__
  const scriptData = $('script')
    .filter((_, el) => {
      return $(el).html()?.includes('__URQL_DATA__') || false
    })
    .html()

  if (!scriptData) {
    console.log('No URQL_DATA found')
    return
  }

  // Very rudimentary extraction
  // The structure is roughly window.__URQL_DATA__ = {...}
  const match = scriptData.match(/window\.__URQL_DATA__\s*=\s*({.*});/)
  if (match) {
    const data = JSON.parse(match[1])
    console.log(Object.keys(data).length, 'keys in data')

    // We can search the keys for streaming providers
    const providers = []
    for (const key of Object.keys(data)) {
      if (key.includes('flatrate') || key.includes('rent') || key.includes('buy')) {
        const item = data[key]
        if (
          (item.title && item.title.includes('netflix')) ||
          item.title.toLowerCase().includes('max')
        ) {
          // Wait, the data has keys like 'Package:cGF8MTY3' which has icon URLs.
        }
      }
    }
  } else {
    console.log('Regex failed')
  }
}

test().catch(console.error)
