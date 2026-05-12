# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Spotlight** — Netflix-style movie search and discovery web app for the Brazilian market. UI language is PT-BR; movie titles display the PT-BR name prominently and the original title in parentheses at 60% opacity / 75% size.

## Commands

```bash
# Development
npm run dev

# Type checking (run before every commit)
npx tsc --noEmit

# Lint + format
npm run lint
npm run format

# Tests
npx vitest                          # unit tests (Vitest)
npx vitest run tests/unit/path/to/file.test.ts   # single unit test
npx playwright test                 # e2e tests
npx playwright test tests/e2e/fluxo-busca-favorito.spec.ts  # single e2e

# Supabase
npx supabase db reset               # apply all migrations locally
npx supabase gen types typescript --local > src/types/database.ts  # regenerate DB types
npx supabase functions serve sync-movies  # run edge function locally

# Build
npm run build
```

Pre-commit hook (husky + lint-staged) runs ESLint, Prettier, and `tsc --noEmit` automatically.

## Stack

- **Next.js 15** with App Router + React 19 — Server Components by default; `'use client'` only when truly needed (state, effects, DOM events)
- **TypeScript** strict mode: `strict`, `noUncheckedIndexedAccess`, `noImplicitAny`
- **Tailwind CSS 4** + **shadcn/ui**
- **Supabase** (Postgres + Auth + Edge Functions + pg_cron)
- **TMDB API** — metadata, posters, cast, watch providers (`/watch/providers` BR region)
- **RapidAPI** — aggregated ratings from IMDb, Rotten Tomatoes, Letterboxd; keyed on **IMDb ID** (`tt\d{7,}`)
- **Zod** for all runtime schemas (env vars, API inputs, external payloads)
- **TanStack Query** for client-side cache
- **next-safe-action** for typed Server Actions
- **Vitest** (unit) + **Playwright** (e2e)
- **Vercel** for frontend deploy

Do not swap any of these dependencies without explicit confirmation.

## Architecture

### Route groups (`src/app/`)

| Group       | Purpose                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `(public)/` | Anonymous routes: home, search (`/busca`), movie detail (`/filme/[slug]`), genre (`/genero/[slug]`), `/privacidade` |
| `(auth)/`   | `entrar/` (magic link + OAuth), `callback/route.ts` (Supabase Auth callback)                                        |
| `(user)/`   | Authenticated routes: `favoritos/`, `watchlist/`; middleware must redirect anonymous users to `/entrar`             |
| `api/`      | `search/route.ts` (rate-limited), `account/route.ts` (DELETE account), `account/export/route.ts` (LGPD data export) |

`middleware.ts` — auth token refresh + security headers + HTTP→HTTPS redirect.

### `src/lib/` modules

- `supabase/server.ts` — `createServerClient` (cookies); `supabase/client.ts` — browser client; `supabase/admin.ts` — `service_role` **server-only, never import from client code**
- `tmdb/` — fetch client, response types, TMDB→internal mappers
- `ratings/` — `RatingsProvider` interface + RapidAPI implementation (IMDb ID as key)
- `search/query-builder.ts` — parametrized Supabase query builder (no string concatenation)
- `actions/` — next-safe-action base client + `favorites.ts` / `watchlist.ts` Server Actions
- `ratelimit.ts` — `@upstash/ratelimit`: 30 req/min by IP for search, 10 req/min by user for writes; **hash IP before using as key**
- `utils.ts` — `cn()` and generic formatters

### Components (`src/components/`)

Grouped by domain, not by type. Barrel `index.ts` only in `ui/`.

- `ui/` — shadcn primitives
- `movie/` — `movie-card`, `movie-row` (horizontal carousel), `movie-detail`, `ratings-badge`, `streaming-badges`
- `search/` — `search-bar`, `filter-panel`
- `layout/` — `header`, `footer`

### Database schema (key tables)

`movies` stores `tmdb_id` (unique) and `imdb_id` (unique, NOT NULL, `tt\d{7,}`) — `imdb_id` is the join key for ratings calls. `movie_ratings` sources: `'imdb' | 'rotten_tomatoes' | 'letterboxd'`. `user_favorites` and `user_watchlist` are user-scoped. Full schema lives in `supabase/migrations/`.

Indexes: trigram on `movies.title_pt` + `movies.title_original` (requires `pg_trgm`), btree on `release_date`, `imdb_id`, `movie_cast.person_id`, `movie_ratings.movie_id`.

### Sync

`supabase/functions/sync-movies/` — Deno Edge Function scheduled via `pg_cron` at 03:00 BRT. Fetches TMDB now-playing / popular / releases / trending. Uses `append_to_response=credits,external_ids,watch/providers`. Upserts by `tmdb_id`. Skips ratings when `imdb_id` is absent. Exponential backoff: 3 retries at 1s / 3s / 9s.

## Code conventions

- **Imports:** absolute via `@/*` → `src/*`
- **Exports:** named exports everywhere; default exports only in `app/**/page.tsx`, `app/**/layout.tsx`, `app/**/route.ts`
- **Types:** `interface` for object shapes, `type` for unions/intersections
- **JSDoc:** required on every public function in `src/lib/` (description, params, return, side effects)
- **No `any`**, no unnarrowed `unknown`, no `as` without a justifying comment
- **Zod as source of truth:** derive types via `z.infer<>`, do not duplicate
- **Conventional Commits:** `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`

## Security (non-negotiable)

- **RLS on every `public` table.** Catalog tables: SELECT public, writes `service_role` only. User tables: `auth.uid() = user_id` on all operations. Write RLS tests in `tests/rls/` that attempt policy violations and assert failure.
- **`service_role` key** never in client code or public routes; only in `supabase/admin.ts` and Edge Functions.
- Every env var validated via Zod in `src/env.ts` at boot — app must refuse to start on missing/invalid vars.
- Every API route and Server Action must apply rate limiting.
- Every Server Action must use next-safe-action with a Zod schema; every API route must validate body/query with Zod.
- **CSP in `next.config.ts`:** `script-src 'self'`, `img-src 'self' image.tmdb.org` + streaming logo domains, `connect-src` restricted to Supabase + RapidAPI.
- Required response headers (set in middleware): `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`.
- **Never log** email addresses, raw IPs, or identifiable search content.

## Definition of Done

A feature is only complete when:

1. `tsc --noEmit` passes with no errors
2. Lint and format pass
3. Unit tests cover the happy path and at least one error case
4. If touching user data: RLS test written and passing
5. If adding a route: rate limiting applied
6. If accepting input: Zod validation applied
7. JSDoc or README updated as needed
8. `npm run build` succeeds

## What NOT to do

- Do not create `utils/`, `helpers/`, `services/`, or `constants/` directories — use `src/lib/utils.ts` or the relevant domain module
- Do not create `hooks/` at repo root — co-locate with the component or place in `src/lib/<domain>/hooks.ts`
- Do not add barrel `index.ts` files outside `components/ui/`
- Do not edit a migration that has already been applied to production — create a new corrective migration
- Do not ask for confirmation before every small change, but **do** confirm before: deploy, production schema changes, RLS policy changes, installing new dependencies

## Preferências de comunicação

- Português brasileiro em toda interação no chat
- Tom direto e conciso, sem linguagem corporativa
- Sem em-dashes em microcopy ou documentação
- Pedir confirmação quando uma decisão tiver mais de um caminho razoável, em vez de assumir

## Como pedir ajuda quando estiver em dúvida

- Se uma instrução do chat conflitar com os arquivos de regra, não assumir — perguntar. Se o usuário pedir uma feature que parece sair do escopo, validar contra spotlight-context.md seção 3 ("O que o Spotlight NÃO é") e seção 9 ("Decisões já tomadas") antes de implementar.
- Quando os arquivos de regra não cobrirem um caso novo, propor uma interpretação e pedir validação antes de implementar — depois sugerir que a decisão seja registrada no arquivo correspondente para sessões futuras.
