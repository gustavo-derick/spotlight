import * as cheerio from 'cheerio'

async function getJsonLdRating(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    const html = await res.text()
    const $ = cheerio.load(html)

    let rating = null
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '{}')
        if (data.aggregateRating && data.aggregateRating.ratingValue) {
          rating = data.aggregateRating.ratingValue
        } else if (Array.isArray(data)) {
          for (const item of data) {
            if (item.aggregateRating && item.aggregateRating.ratingValue) {
              rating = item.aggregateRating.ratingValue
            }
          }
        }
      } catch (e) {}
    })
    return rating
  } catch (error) {
    return null
  }
}

async function test() {
  const imdb = await getJsonLdRating('https://www.imdb.com/title/tt15398776/') // Oppenheimer
  const lb = await getJsonLdRating('https://letterboxd.com/film/oppenheimer-2023/')
  console.log({ imdb, lb })
}

test().catch(console.error)
