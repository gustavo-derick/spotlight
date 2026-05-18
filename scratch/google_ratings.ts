import * as cheerio from 'cheerio'

async function getRatings(title: string) {
  const query = `${title} imdb rotten tomatoes letterboxd rating`
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  const html = await res.text()
  const $ = cheerio.load(html)

  const text = $('body').text()

  // Quick regex on the raw text (which includes the Knowledge Graph panel and snippets)
  let imdb = null
  let rt = null
  let lb = null

  // IMDb usually "Rating: 8.4/10" or "8.4/10 · IMDb"
  const imdbMatch =
    text.match(/(\d[\d\.]+)\/10.*IMDb/i) ||
    text.match(/IMDb.*?(\d[\d\.]+)\/10/i) ||
    text.match(/Rating:\s*(\d[\d\.]+)\/10/i)
  if (imdbMatch) imdb = imdbMatch[1]

  // RT usually "93% · Rotten Tomatoes" or "Rotten Tomatoes: 93%"
  const rtMatch =
    text.match(/(\d{1,3})%.*Rotten Tomatoes/i) || text.match(/Rotten Tomatoes.*?(\d{1,3})%/i)
  if (rtMatch) rt = rtMatch[1]

  // Letterboxd usually "4.3/5 · Letterboxd"
  const lbMatch =
    text.match(/(\d[\d\.]+)\/5.*Letterboxd/i) || text.match(/Letterboxd.*?(\d[\d\.]+)\/5/i)
  if (lbMatch) lb = lbMatch[1]

  console.log('Google results for', title, ':', { imdb, rt, lb })
}

getRatings('Oppenheimer (2023)').catch(console.error)
