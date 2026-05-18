# Spotlight — Estrutura de Diretórios

> Estrutura canônica do projeto. Toda nova pasta ou arquivo deve respeitar esta organização. Mudanças estruturais exigem confirmação no chat antes de serem aplicadas.

---

## Visão geral

```
spotlight/
├── .agent/
│   ├── rules/                          # regras persistentes do Antigravity
│   └── workflows/                      # workflows /comando (criados sob demanda)
├── .github/
│   └── workflows/
│       └── ci.yml                      # lint, type-check, test, build, audit, gitleaks
├── .husky/                             # pre-commit hooks
├── public/                             # assets estáticos servidos pelo Next
├── src/
│   ├── app/                            # App Router (Next.js 15)
│   ├── components/                     # componentes React
│   ├── lib/                            # lógica de negócio, clients, utils
│   ├── types/                          # tipos globais e gerados
│   └── env.ts                          # validação Zod das variáveis de ambiente
├── supabase/
│   ├── migrations/                     # SQL versionado
│   ├── functions/                      # Edge Functions (Deno)
│   └── seed.sql                        # dados de seed para dev local
├── tests/
│   ├── unit/                           # Vitest
│   ├── e2e/                            # Playwright
│   └── rls/                            # testes SQL de policies
├── .env.example                        # template, sem valores reais
├── .gitignore                          # inclui .env*, node_modules, .next
├── .gitleaks.toml                      # config do secrets scanning
├── .nvmrc                              # versão fixa do Node
├── commitlint.config.ts                # Conventional Commits
├── eslint.config.mjs
├── next.config.ts                      # CSP, headers, imagens permitidas
├── package.json
├── README.md                           # setup, scripts, seção "Working with AI"
├── SECURITY.md                         # política de divulgação responsável
├── tailwind.config.ts
├── tsconfig.json                       # strict + noUncheckedIndexedAccess
└── vitest.config.ts
```

---

## `src/app/` — App Router

Organizado por **route groups** (parênteses) para separar layouts e níveis de autenticação sem afetar a URL.

```
src/app/
├── (public)/                           # rotas anônimas, sem auth obrigatória
│   ├── page.tsx                        # home estilo Netflix
│   ├── busca/
│   │   └── page.tsx                    # resultados de busca
│   ├── filme/
│   │   └── [slug]/
│   │       └── page.tsx                # detalhe do filme
│   ├── genero/
│   │   └── [slug]/
│   │       └── page.tsx                # browse por gênero
│   └── privacidade/
│       └── page.tsx                    # política de privacidade LGPD
├── (auth)/                             # fluxo de autenticação
│   ├── entrar/
│   │   └── page.tsx                    # magic link + OAuth
│   └── callback/
│       └── route.ts                    # callback do Supabase Auth
├── (user)/                             # rotas que exigem usuário logado
│   ├── favoritos/
│   │   └── page.tsx
│   └── watchlist/
│       └── page.tsx
├── api/                                # rotas API server-side
│   ├── search/
│   │   └── route.ts                    # rate-limited
│   └── account/
│       ├── route.ts                    # DELETE → apaga conta + dados
│       └── export/
│           └── route.ts                # GET → exporta dados (art. 18 LGPD)
├── layout.tsx                          # layout raiz, providers globais
├── globals.css                         # tailwind base + variáveis CSS
└── middleware.ts                       # auth refresh + headers + redirect HTTPS
```

**Regras de route groups:**

- `(public)` — rotas que funcionam sem login, mas que se beneficiam dele
- `(auth)` — fluxo de entrada/callback
- `(user)` — middleware deve garantir sessão válida; redirecionar para `/entrar` se anônimo
- Cada grupo pode ter seu próprio `layout.tsx` se precisar de header/footer diferente

---

## `src/components/` — Componentes React

Agrupados por **domínio**, não por tipo. Componentes de UI primitivos (botão, input, dialog) ficam em `ui/`; tudo que tem regra de negócio vai pro domínio correspondente.

```
src/components/
├── ui/                                 # shadcn/ui primitives — únicos com index.ts
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── movie/
│   ├── movie-card.tsx                  # capa + título PT/original + hover
│   ├── movie-row.tsx                   # carrossel horizontal
│   ├── movie-detail.tsx                # página completa
│   ├── ratings-badge.tsx               # IMDb + RT + Letterboxd
│   └── streaming-badges.tsx            # logos dos providers BR
├── search/
│   ├── search-bar.tsx                  # input principal
│   └── filter-panel.tsx                # filtros de gênero, ano etc.
└── layout/
    ├── header.tsx                      # logo Spotlight + busca + menu user
    └── footer.tsx                      # links institucionais + privacidade
```

**Convenções:**

- Server Component por padrão. `'use client'` apenas em arquivos com `useState`, `useEffect`, eventos de DOM ou hooks de browser
- Um componente por arquivo, nome do arquivo em `kebab-case`, componente exportado em `PascalCase`
- Named exports sempre

---

## `src/lib/` — Lógica de negócio

Tudo que não é componente React vai aqui. Cada subpasta é um módulo coeso com fronteira clara.

```
src/lib/
├── supabase/
│   ├── server.ts                       # createServerClient (cookies)
│   ├── client.ts                       # createBrowserClient
│   └── admin.ts                        # service_role — APENAS server-side
├── tmdb/
│   ├── client.ts                       # fetch wrapper + auth
│   ├── types.ts                        # shapes da resposta TMDB
│   └── mappers.ts                      # TMDB → schema interno
├── ratings/
│   ├── client.ts                       # interface RatingsProvider
│   ├── rapidapi.ts                     # impl concreta (chave: imdb_id)
│   └── types.ts
├── search/
│   └── query-builder.ts                # constrói filtros parametrizados
├── actions/                            # Server Actions via next-safe-action
│   ├── safe-action.ts                  # client base + middlewares
│   ├── favorites.ts                    # toggle, list
│   └── watchlist.ts                    # add, remove, mark watched
├── ratelimit.ts                        # @upstash/ratelimit configurado
└── utils.ts                            # cn(), formatadores genéricos
```

**Regras críticas:**

- `supabase/admin.ts` **nunca** pode ser importado de arquivo client (`'use client'`) ou de rota pública sem auth check. Adicionar comentário no topo do arquivo: `// SERVER-ONLY — não importar do client`
- Toda função pública em `lib/` precisa de JSDoc com descrição, params, retorno e efeitos colaterais
- Schemas Zod ficam no mesmo arquivo do módulo que os usa, exceto quando compartilhados entre módulos (aí vão para `lib/schemas/`)

---

## `src/types/` — Tipos globais

```
src/types/
└── database.ts                         # gerado via `supabase gen types typescript`
```

Não criar tipos manualmente aqui que duplicam o que já é gerado. Para tipos de domínio derivados, usar `z.infer<>` no próprio módulo.

---

## `supabase/` — Banco e funções

```
supabase/
├── migrations/                         # ordem importa, nomes com timestamp
│   ├── 00000000000001_extensions.sql   # habilita pg_trgm, pgcrypto
│   ├── 00000000000002_schema.sql       # tabelas
│   ├── 00000000000003_rls_policies.sql # RLS em TODAS as tabelas
│   ├── 00000000000004_indexes.sql      # trigram + btree
│   └── 00000000000005_search_functions.sql  # RPC para busca textual
├── functions/
│   └── sync-movies/
│       ├── index.ts                    # entrypoint Deno
│       └── deno.json                   # imports e permissions
└── seed.sql                            # filmes de exemplo para dev
```

**Regras de migration:**

- Nunca editar migration já aplicada em produção. Criar nova migration corretiva
- Toda migration que cria tabela deve, na mesma migration ou imediatamente na próxima, habilitar RLS e criar policies
- Comentar no topo de cada arquivo SQL o que ela faz e por quê

---

## `tests/` — Testes

```
tests/
├── unit/                               # Vitest
│   ├── lib/
│   │   ├── tmdb/mappers.test.ts
│   │   ├── ratings/rapidapi.test.ts
│   │   └── search/query-builder.test.ts
│   └── env.test.ts
├── e2e/                                # Playwright
│   └── fluxo-busca-favorito.spec.ts    # home → busca → detalhe → favoritar
└── rls/                                # testes SQL de policies
    ├── user-favorites.test.sql
    ├── user-watchlist.test.sql
    └── catalog-readonly.test.sql
```

**Cobertura mínima exigida no MVP:**

- Validação Zod das envs
- Query builder de busca
- Mapper TMDB → schema interno
- Rate limit (caminho feliz + bloqueio)
- RLS de favoritos e watchlist (tentativa de acesso de outro usuário deve falhar)
- 1 e2e cobrindo fluxo principal autenticado

---

## Arquivos de raiz — checklist obrigatório

| Arquivo          | Função                                                                           |
| ---------------- | -------------------------------------------------------------------------------- |
| `.env.example`   | Todas as chaves esperadas, sem valores reais, com comentários                    |
| `.gitignore`     | `.env*`, `node_modules`, `.next`, `coverage`, `*.log`, `.DS_Store`               |
| `.gitleaks.toml` | Regras de secrets scanning                                                       |
| `.nvmrc`         | Versão do Node fixada                                                            |
| `next.config.ts` | CSP, security headers, `remotePatterns` para image.tmdb.org e logos de streaming |
| `tsconfig.json`  | `strict`, `noUncheckedIndexedAccess`, `paths` com `@/*` → `src/*`                |
| `README.md`      | Setup passo a passo, scripts, seção "Working with AI" com convenções             |
| `SECURITY.md`    | Como reportar vulnerabilidade, email de contato, SLA de resposta                 |

---

## O que NÃO criar

- Pasta `utils/` ou `helpers/` na raiz — vai em `src/lib/utils.ts` ou em módulo específico
- Pasta `services/` separada — Server Actions ficam em `src/lib/actions/`, lógica de domínio em `src/lib/<dominio>/`
- Pasta `hooks/` global — hooks customizados ficam ao lado do componente que os usa, ou em `src/lib/<dominio>/hooks.ts` se compartilhados
- Arquivos `index.ts` (barrel) fora de `components/ui/` — prejudica tree-shaking
- Pasta `constants/` — constantes ficam no módulo que as usa
