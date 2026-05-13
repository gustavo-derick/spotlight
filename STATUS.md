# Spotlight — Status do Projeto

> Última atualização: 2026-05-12
> Supabase project ref: `rqqotucosggxlcsjmtfl`

---

## Histórico de alterações

### Bloco 1 — Setup base (`b0833ae`)
- Scaffold Next.js 15 + App Router + React 19
- TypeScript strict (`noUncheckedIndexedAccess`, `noImplicitAny`)
- Tailwind CSS 4 + shadcn/ui
- Estrutura de rotas: `(public)/`, `(auth)/`, `(user)/`, `api/`
- Stubs de todas as páginas e rotas (retornam "em construção" / 501)
- Husky + lint-staged (ESLint, Prettier, `tsc --noEmit`) no pre-commit
- Vitest + Playwright configurados

### Bloco 2 — Segurança e variáveis de ambiente (`ce922da`)
- `src/env.ts` — validação Zod de todas as env vars ao boot; app recusa iniciar se ausentes
- CSP em `next.config.ts`: `script-src 'self'`, `img-src` restrito a TMDB e logos de streaming
- Headers obrigatórios no `middleware.ts`: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
- Redirect HTTP → HTTPS em produção

### Bloco 3 — Banco de dados (`70fce0f`)
- 6 migrations SQL em `supabase/migrations/`:
  - `_001` extensões (`pg_trgm`, `pgcrypto`, `uuid-ossp`)
  - `_002` schema completo: `movies`, `people`, `movie_cast`, `movie_crew`, `movie_ratings`, `movie_streaming`, `genres`, `user_favorites`, `user_watchlist`, `sync_logs`, `rate_limits`
  - `_003` RLS policies: catálogo público somente leitura, tabelas de usuário restritas por `auth.uid()`
  - `_004` índices: trigram em `title_pt`/`title_original`, btree em `release_date`, `imdb_id`, `movie_cast.person_id`, `movie_ratings.movie_id`
  - `_005` funções RPC: `search_movies` (trigram + ILIKE), `check_rate_limit` (atômico), `cleanup_rate_limits`, `cleanup_sync_logs`
  - `_006` jobs pg_cron: `sync-movies` às 03:00 BRT, limpeza de `rate_limits` de hora em hora, limpeza de `sync_logs` todo dia
- Testes SQL de RLS em `tests/rls/` (catálogo, favoritos, watchlist)

### Bloco 4 — Clientes e módulo TMDB (`56805bc`)
- `src/lib/supabase/server.ts` — `createServerClient` com cookies
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/admin.ts` — `service_role` (server-only)
- `src/lib/tmdb/client.ts` — `tmdbFetch` com cache Next.js, funções `fetchMovieDetails`, `fetchNowPlaying`, `fetchPopular`, `fetchUpcoming`, `fetchTrending`, `fetchGenres`
- `src/lib/tmdb/types.ts` — tipos das respostas TMDB (apenas campos usados)
- `src/lib/tmdb/mappers.ts` — `mapMovieDetails` → `MovieInsert + cast + crew + streamingBR`; mappers de cast, crew e watch providers BR
- Testes unitários: `tests/unit/lib/tmdb/mappers.test.ts` (20 testes)

### Bloco 5 — Tipos e stub de ratings (`6853cd2`)
- `src/types/database.ts` — tipos concretos manuais (`Movie`, `MovieRating`, `MovieStreaming`, etc.) enquanto `supabase gen types` não é executado no projeto remoto
- `src/lib/ratings/client.ts` — interface `RatingsProvider`, `assertValidImdbId`, `IMDB_ID_REGEX`
- `src/lib/ratings/types.ts` — `RatingResult`, `RatingsResponse`, `RatingsError`
- Stub inicial do `rapidapi.ts` (apontava para API errada)

### Bloco 6 — Módulo ratings completo (não commitado ainda)
- `src/lib/ratings/rapidapi.ts` reescrito:
  - API corrigida: `movies-ratings2.p.rapidapi.com/ratings?id={imdbId}`
  - Schema Zod expandido: IMDb (0–10), Rotten Tomatoes / tomatometer (0–100), Letterboxd (0–5)
  - Escala correta em `score_max` para cada fonte
- `tests/unit/lib/ratings/rapidapi.test.ts` — 21 testes cobrindo happy path, respostas parciais, 404/429/500, falha de rede, JSON inválido, chave ausente
- `tsconfig.json` — `supabase/functions/` excluído da compilação do Next.js

### Bloco 7 — Edge function sync-movies (não commitado ainda)
- `supabase/functions/sync-movies/index.ts` — Deno Edge Function completa:
  - Coleta tmdb_ids de 4 endpoints (now_playing, popular, upcoming, trending), 2–3 páginas cada, deduplicado
  - Fetch de detalhes com `append_to_response=credits,external_ids,watch/providers`
  - Retry com backoff exponencial: 3 tentativas a 1s / 3s / 9s
  - Concorrência de 5 filmes em paralelo
  - Upsert em batch: pessoas + elenco (top 20) + equipe técnica em 2 queries por filme
  - Ratings via RapidAPI como best-effort (404 silenciado, erros logados mas não falham o sync)
  - Log de execução em `sync_logs` (started → success/error + `items_processed`)
- `supabase/functions/sync-movies/deno.json` — import map para o módulo Supabase

---

## O que está travando e precisa ser corrigido

### Crítico

**1. Migrations não aplicadas no projeto remoto**
As migrations existem localmente mas nunca foram executadas no Supabase remoto (`rqqotucosggxlcsjmtfl`). O banco remoto está vazio — não há tabelas, RLS, índices nem funções.
```bash
# Comandos para desbloquear:
npx supabase link --project-ref rqqotucosggxlcsjmtfl
npx supabase db push
```

**2. `database.ts` com tipos genéricos**
O arquivo `src/types/database.ts` tem os tipos concretos definidos manualmente (workaround) mas o bloco `Database` gerado está vazio (`Tables: { [_ in never]: never }`). Os clientes Supabase (`createClient<Database>`) não têm autocomplete de tabela. Resolver após `db push`:
```bash
npx supabase gen types typescript --project-id rqqotucosggxlcsjmtfl > src/types/database.ts
```
Após gerar, remover os tipos manuais da seção `// Tipos concretos do schema Spotlight` e substituir por aliases de `Tables<'movies'>` etc.

**3. `pg_cron` precisa de variáveis de ambiente no banco**
O job `sync-movies-03h-brt` usa `current_setting('app.settings.supabase_url')` e `current_setting('app.settings.service_role_key')`. Sem configurar essas settings no projeto Supabase, o job vai falhar silenciosamente.
```sql
-- Executar no SQL Editor do Supabase Dashboard:
ALTER DATABASE postgres
  SET app.settings.supabase_url     = 'https://rqqotucosggxlcsjmtfl.supabase.co';
ALTER DATABASE postgres
  SET app.settings.service_role_key = '<service-role-key>';
```

**4. Chave RapidAPI exposta no histórico do chat**
A chave `b84e98384dmsh10168ea5f6a6d65p19c546jsnc56b5c881390` apareceu no chat. Deve ser rotacionada no painel RapidAPI e atualizada no `.env.local` e nos secrets do Vercel.

### Importante

**5. Middleware é stub**
`src/middleware.ts` tem o redirect HTTPS mas não implementa o refresh do token de sessão do Supabase nem o bloqueio de rotas autenticadas. As rotas `(user)/` ficam acessíveis sem login.

**6. Nenhuma página ou rota API implementada**
Todas as páginas retornam "em construção" e todas as rotas API retornam 501. A UI está completamente em branco.

**7. Variáveis de ambiente não estão no `.env.local`**
O arquivo `.env.example` existe mas `.env.local` precisa ser criado com os valores reais para rodar `npm run dev` com funcionalidade.

---

## Próximos passos

### Prioridade 1 — Infraestrutura (pré-requisito para tudo)
- [ ] Criar `.env.local` com `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TMDB_API_KEY`, `RAPIDAPI_KEY` (chave nova)
- [ ] `npx supabase link` + `npx supabase db push` — aplicar migrations no remoto
- [ ] `npx supabase gen types typescript` — regenerar `database.ts` e remover tipos manuais
- [ ] Configurar `app.settings` no banco para o cron funcionar
- [ ] Commit dos blocos 6 e 7 (ratings + edge function + cron)

### Prioridade 2 — Middleware e autenticação
- [ ] `middleware.ts` — adicionar `createServerClient` + `supabase.auth.getSession()` para refresh de token; redirecionar rotas `(user)/` para `/entrar` se não autenticado
- [ ] Página `/entrar` — magic link + OAuth (Google); usar `supabase.auth.signInWithOtp` e `signInWithOAuth`
- [ ] `(auth)/callback/route.ts` — trocar code por session com `supabase.auth.exchangeCodeForSession`

### Prioridade 3 — Componentes base (bloqueiam todas as páginas)
- [ ] `src/components/layout/header.tsx` — logo, campo de busca, avatar do usuário
- [ ] `src/components/layout/footer.tsx` — link privacidade, copyright
- [ ] `src/components/movie/movie-card.tsx` — poster, título PT-BR, título original (60% opacidade), badge de streaming
- [ ] `src/components/movie/movie-row.tsx` — carrossel horizontal de `MovieCard`
- [ ] `src/components/movie/ratings-badge.tsx` — IMDb / RT / Letterboxd inline

### Prioridade 4 — Página Home
- [ ] `(public)/page.tsx` — Server Component; busca filmes populares/em cartaz via Supabase; renderiza `MovieRow` por categoria

### Prioridade 5 — Busca
- [ ] `src/app/api/search/route.ts` — GET com rate limiting (30 req/min por IP hasheado), chama `search_movies` RPC, valida query com Zod
- [ ] `src/components/search/search-bar.tsx` — input com debounce, TanStack Query
- [ ] `src/components/search/filter-panel.tsx` — filtro por gênero
- [ ] `(public)/busca/page.tsx` — combina SearchBar + FilterPanel + resultados

### Prioridade 6 — Detalhe do filme
- [ ] `src/components/movie/movie-detail.tsx` — backdrop, título, sinopse, elenco, ratings, onde assistir
- [ ] `src/components/movie/streaming-badges.tsx` — logos dos provedores BR
- [ ] `(public)/filme/[slug]/page.tsx` — Server Component; carrega dados pelo slug (tmdb_id ou imdb_id)

### Prioridade 7 — Funcionalidades de usuário
- [ ] `src/lib/actions/favorites.ts` — Server Actions: `addFavorite`, `removeFavorite` (next-safe-action + Zod + rate limit)
- [ ] `src/lib/actions/watchlist.ts` — Server Actions: `addToWatchlist`, `removeFromWatchlist`, `markWatched`
- [ ] `(user)/favoritos/page.tsx` — lista de favoritos do usuário autenticado
- [ ] `(user)/watchlist/page.tsx` — watchlist com status watched/unwatched

### Prioridade 8 — APIs de conta e privacidade
- [ ] `api/account/route.ts` — DELETE: remove conta e dados via `service_role`
- [ ] `api/account/export/route.ts` — GET: exporta dados do usuário em JSON (LGPD)
- [ ] `(public)/privacidade/page.tsx` — conteúdo da política de privacidade

### Prioridade 9 — CI e deploy
- [ ] `.github/workflows/ci.yml` — lint, type-check, vitest, build, gitleaks
- [ ] Configurar secrets no Vercel (env vars de produção)
- [ ] Primeiro deploy em produção
- [ ] Testar cron job manualmente após deploy (`npx supabase functions serve sync-movies`)
