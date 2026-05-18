import * as cheerio from 'cheerio'

async function run() {
  const imdbId = 'tt0069095' // Pink Flamingos

  console.log(`Fetching Letterboxd for ${imdbId}...`)
  const url = `https://letterboxd.com/imdb/${imdbId}/`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const html = await res.text()
    const $ = cheerio.load(html)

    const reviews: any[] = []

    $('.film-popular-review').each((i, el) => {
      const author = $(el).find('.name').text().trim()
      const ratingClass = $(el).find('.rating').attr('class') || ''
      let rating = null
      const match = ratingClass.match(/rated-(\d+)/)
      if (match) {
        rating = parseInt(match[1]) / 2 // converts 10-scale to 5-star scale
      }

      const content = $(el).find('.body-text').text().trim()
      const url = 'https://letterboxd.com' + $(el).find('a.context').attr('href')

      if (author && content) {
        reviews.push({ author, rating, content, url })
      }
    })

    console.log(`Found ${reviews.length} reviews!`)
    console.log(reviews.slice(0, 2))
  } catch (err) {
    console.error('Scrape error:', err)
  }
}

run()
