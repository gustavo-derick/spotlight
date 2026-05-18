import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

async function check() {
  const { data: logs, error: logsError } = await supabase
    .from('sync_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(5)

  console.log('--- RECENT LOGS ---')
  console.log(logs)
  if (logsError) console.error(logsError)

  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('id, title_pt')
    .limit(2)

  console.log('\n--- MOVIES COUNT ---')
  console.log(movies?.length)
  if (moviesError) console.error(moviesError)
}

check()
