# Spotlight — Regras Gerais do Projeto

> Este arquivo é a fonte da verdade para o agente Antigravity ao trabalhar no Spotlight. Toda decisão técnica deve estar alinhada com estas regras. Em caso de conflito com instruções pontuais do chat, perguntar antes de divergir.

---

## 1. Identidade do projeto

- **Nome:** Spotlight
- **O que é:** app web de busca e descoberta de filmes com estética Netflix
- **Idioma da interface:** Português do Brasil (PT-BR). Títulos exibem PT-BR em destaque e o original entre parênteses com menor opacidade e tamanho.
- **Usuário-alvo:** público brasileiro buscando o que assistir e onde
- **Modelo de negócio MVP:** gratuito, sem ads, sem tracking de terceiros

## 2. Stack obrigatória

- **Next.js 15** com App Router e React 19 — Server Components por padrão, Client Components só com interação
- **TypeScript** modo estrito: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny: true`
- **Tailwind CSS 4** + **shadcn/ui**
- **Supabase** (Postgres + Auth + Edge Functions + pg_cron) como banco principal
- **TMDB API** para metadados (capa, sinopse, elenco, diretor, watch providers BR via `/watch/providers`)
- **RapidAPI** para ratings agregados de IMDb, Rotten Tomatoes e Letterboxd — **a API usa o IMDb ID (`tt\d{7,}`) como chave de consulta**
- **Vercel** para deploy do frontend
- **Zod** para todo schema runtime (env, inputs de API, payloads externos)
- **TanStack Query** para cache client-side
- **next-safe-action** para Server Actions tipadas
- **Vitest** (unit) + **Playwright** (e2e)

Não trocar nenhuma dessas dependências sem confirmação explícita no chat.

## 3. Convenções de código

- **Imports absolutos** via `@/*` apontando para `src/*`
- **Named exports** sempre, default exports só em `app/**/page.tsx`, `app/**/layout.tsx`, `app/**/route.ts`
- **`interface`** para shapes de objeto, **`type`** para uniões/intersecções
- **JSDoc obrigatório** em toda função pública de `src/lib/`
- **Funções pequenas e puras**, uma responsabilidade por arquivo
- **Sem `any`**, sem `unknown` sem narrowing, sem `as` exceto em casos justificados com comentário
- **Mensagens de erro com contexto** — nunca `throw new Error('falhou')`
- **Schemas Zod como fonte da verdade**: tipos via `z.infer<>`, sem duplicar
- **Barrel files (`index.ts`)** só em `components/ui/`
- **Conventional Commits** obrigatórios (feat, fix, chore, refactor, docs, test, ci)

## 4. Organização de diretório

```
spotlight/
├── .agent/rules/           # estas regras
├── .github/workflows/      # CI
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/       # rotas anônimas: home, busca, detalhe, gênero, privacidade
│   │   ├── (auth)/         # entrar, callback OAuth
│   │   ├── (user)/         # favoritos, watchlist (autenticadas)
│   │   ├── api/            # rotas API server-side
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── middleware.ts   # auth + headers de segurança + redirect HTTPS
│   ├── components/
│   │   ├── ui/             # shadcn primitives
│   │   ├── movie/          # card, row, detail, ratings-badge, streaming-badges
│   │   ├── search/         # search-bar, filter-panel
│   │   └── layout/         # header, footer
│   ├── lib/
│   │   ├── supabase/       # server.ts, client.ts, admin.ts (service_role)
│   │   ├── tmdb/           # client, types, mappers
│   │   ├── ratings/        # interface RatingsProvider + impl RapidAPI
│   │   ├── search/         # query builder
│   │   ├── actions/        # next-safe-action
│   │   ├── ratelimit.ts
│   │   └── utils.ts
│   ├── env.ts              # validação Zod das envs
│   └── types/database.ts   # gerado via supabase gen types
├── supabase/
│   ├── migrations/         # SQL versionado
│   ├── functions/sync-movies/
│   └── seed.sql
├── tests/{unit,e2e,rls}/
├── .env.example
├── .gitleaks.toml
└── README.md
```

## 5. Segurança — não negociável

Todas as regras desta seção são obrigatórias e devem estar implementadas antes do primeiro deploy.

### RLS
- Habilitar Row Level Security em **todas** as tabelas do schema `public`, sem exceção
- Tabelas de catálogo (movies, people, ratings, streaming, genres): SELECT público, escrita apenas `service_role`
- Tabelas de usuário (user_favorites, user_watchlist): policy `auth.uid() = user_id` em todas operações
- Tabela `sync_logs`: SELECT apenas `service_role`
- Criar testes SQL em `tests/rls/` que tentem violar cada policy e confirmem falha

### Chaves e variáveis de ambiente
- `service_role` key **nunca** no client, nunca em rota pública. Apenas em Edge Functions e em arquivos `src/lib/supabase/admin.ts` (server-only)
- Toda env validada via Zod no boot em `src/env.ts` — app não inicia se faltar ou tiver formato inválido
- Separar `NEXT_PUBLIC_*` (cliente) de variáveis server-only
- `.env.local` no `.gitignore` desde o primeiro commit
- `.env.example` com todas as chaves e comentários, sem valores reais

### Auth
- Supabase Auth com magic link + OAuth (Google + GitHub)
- Cookies de sessão: `httpOnly`, `secure`, `sameSite=lax`
- Usar `createServerClient` do `@supabase/ssr` em todo código server-side
- Middleware renova token automaticamente

### Headers e proteções
- CSP estrita em `next.config.ts`: `script-src 'self'`, `img-src 'self' image.tmdb.org` + domínios de logos de streaming, `connect-src` restrito a Supabase + RapidAPI
- Headers obrigatórios via middleware: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restritiva
- HTTPS forçado com redirect HTTP→HTTPS
- CORS explícito em Edge Functions, nunca `*`

### Rate limiting
- `@upstash/ratelimit` em todas rotas API e Server Actions
- Busca: 30 req/min por IP
- Escritas autenticadas: 10 req/min por usuário
- Hash de IP antes de usar como chave de rate limit (privacidade)

### Validação de input
- Toda Server Action via `next-safe-action` com schema Zod
- Toda rota API valida body/query com Zod
- Buscas usam queries parametrizadas do Supabase, nunca concatenação de string
- Limite de 200 chars em query de busca

### Privacidade do usuário (LGPD)
- Coleta mínima: apenas email + id do Supabase Auth. Sem telefone, sem endereço, sem nome obrigatório
- **Sem trackers de terceiros** no MVP. Sem Google Analytics, sem Meta Pixel. Vercel Analytics anônimo é aceitável
- Página `/privacidade` explicando o que é e o que não é coletado
- Rota `DELETE /api/account` apaga favoritos, watchlist e chama `supabase.auth.admin.deleteUser()`
- Rota `GET /api/account/export` devolve JSON com dados do usuário (art. 18 LGPD)
- Logs **nunca** contêm email, IP em texto cheio ou conteúdo de busca identificável
- TLS obrigatório, HSTS preload-ready

### Higiene de repo
- Pre-commit via `husky` + `lint-staged`: ESLint, Prettier, `tsc --noEmit`
- CI GitHub Actions: lint, type-check, testes, build, `npm audit --audit-level=high`
- `gitleaks` no CI para secrets scanning
- Dependabot ou Renovate ativo para atualizações de dependências

## 6. Modelo de dados (referência rápida)

Tabelas principais — schema completo nas migrations:

- `movies` — id, tmdb_id (unique), **imdb_id (unique, NOT NULL, formato `tt\d{7,}`)**, title_pt, title_original, original_language, overview_pt, release_date, runtime, poster_url, backdrop_url, genres[], last_synced_at
- `people` — id, tmdb_id, name, profile_url, known_for
- `movie_cast` — movie_id, person_id, character, order
- `movie_crew` — movie_id, person_id, job
- `movie_ratings` — movie_id, source ('imdb'|'rotten_tomatoes'|'letterboxd'), score, score_max, votes, url, fetched_at
- `movie_streaming` — movie_id, provider_name, provider_logo_url, type ('flatrate'|'rent'|'buy'|'ads'), region='BR', link
- `genres` — tmdb_id, name_pt
- `user_favorites` — user_id, movie_id, created_at
- `user_watchlist` — user_id, movie_id, created_at, watched
- `sync_logs` — id, function_name, status, started_at, finished_at, error_message, items_processed

Índices: trigram em `movies.title_pt` e `movies.title_original`, btree em `movies.release_date`, `movies.imdb_id`, `movie_cast.person_id`, `movie_ratings.movie_id`. Habilitar `pg_trgm` na primeira migration.

## 7. Sincronização diária

- **Supabase Edge Function** `sync-movies` agendada via `pg_cron` às **03:00 BRT** todo dia
- Consulta TMDB: em cartaz, populares, lançamentos da semana, tendências
- Para cada filme: `/movie/{id}?append_to_response=credits,external_ids,watch/providers` — `external_ids.imdb_id` é a chave usada nas chamadas ao RapidAPI
- Se TMDB não devolver `imdb_id`, pular ratings e registrar em `sync_logs` em vez de falhar
- Idempotência via upsert por `tmdb_id`
- Backoff exponencial em falhas de API externa (3 tentativas, 1s/3s/9s)
- Logs estruturados em `sync_logs` com retenção de 30 dias

## 8. UI/UX

- **Tema escuro por padrão** (estética Netflix), light opcional via `next-themes`
- **Home:** hero + carrosséis horizontais (Em Cartaz, Tendências, Top Rated, por Gênero)
- **Card de filme:** capa, título PT-BR, título original em parênteses com 60% opacidade e 75% do tamanho. Hover revela rating principal + botão de favoritar
- **Página de detalhe:** backdrop full-width, capa à esquerda, metadados à direita, ratings em badges com as cores oficiais de cada fonte (IMDb amarelo, RT vermelho/verde, Letterboxd laranja)
- **Streamings:** logo + tipo (Inclui no plano / Aluga / Compra) com deep link quando disponível
- **Skeleton loaders** em toda busca e listagem
- **Mobile-first** e responsivo
- **Sem em-dashes** em microcopy. Português brasileiro, direto, sem corporativês

## 9. Workflow do agente Antigravity

- **Plan → Execute → Verify** em todas tasks. Sempre gerar `implementation_plan.md` antes de codificar features novas
- Toda task quebrada em subtasks de no máximo 1 hora
- `implementation_plan.md` **deve conter** uma seção "Implicações de Segurança" para qualquer mudança que toque auth, RLS, envs, rotas API ou dados de usuário
- Antes de instalar nova dependência: verificar tamanho, manutenção e licença. Justificar no plano
- Antes de criar nova tabela: confirmar RLS + policies + testes
- Walkthrough final deve incluir prints ou GIF da mudança visual
- **Nunca commitar** `.env*`, chaves, tokens, screenshots com PII
- Pedir confirmação antes de: deploy, mudança de schema em produção, mudança em policy de RLS, instalação de dependência nova

## 10. Definition of Done

Uma feature só é considerada pronta quando:

1. Código tipado (sem `any`), passando `tsc --noEmit`
2. Lint e formatação OK
3. Testes unitários cobrindo o caminho feliz + ao menos 1 caso de erro
4. Se toca dados de usuário: teste de RLS escrito e passando
5. Se cria rota: rate limit aplicado
6. Se recebe input: validação Zod aplicada
7. Documentação no README ou JSDoc atualizada
8. Sem regressão em testes existentes
9. Build de produção passa
10. Commit segue Conventional Commits