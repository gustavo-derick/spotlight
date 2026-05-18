import * as cheerio from 'cheerio'

async function testImdb(imdbId: string) {
  try {
    const url = `https://www.imdb.com/title/${imdbId}/`
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })
    console.log('Status:', res.status)
    const html = await res.text()
    const $ = cheerio.load(html)

    // IMDb usually has JSON-LD
    let rating = null
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '{}')
        if (data.aggregateRating && data.aggregateRating.ratingValue) {
          rating = data.aggregateRating.ratingValue
        } else if (Array.isArray(data)) {
          // sometimes it's an array
          for (const item of data) {
            if (item.aggregateRating && item.aggregateRating.ratingValue) {
              rating = item.aggregateRating.ratingValue
            }
          }
        }
      } catch (e) {}
    })

    console.log('JSON-LD Rating:', rating)

    // If JSON-LD fails, try extracting from HTML
    if (!rating) {
      const ratingText = $(
        'div[data-testid="hero-rating-bar__aggregate-rating__score"] > span:first-child',
      ).text()
      console.log('HTML Rating:', ratingText)
    }
  } catch (error) {
    console.error(error)
  }
}

testImdb('tt15398776').catch(console.error)
