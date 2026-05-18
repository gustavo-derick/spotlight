import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

async function run() {
  const apiKey = process.env.TMDB_API_KEY
  console.log('Key available:', !!apiKey)
  // Pink Flamingos tmdb_id is 692

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/692/reviews?language=en-US&page=1`,
    options,
  )
  const data = await res.json()
  console.log(data)
}

run()
