# Spotlight — Segurança e Privacidade

> Fonte da verdade para segurança, privacidade e LGPD. Toda funcionalidade que toque auth, dados de usuário, envs, RLS, rotas API ou integrações externas deve estar alinhada com este documento. Em caso de dúvida, perguntar no chat antes de implementar.

---

## 1. Princípios fundamentais

O Spotlight opera sob três princípios não-negociáveis:

1. **Privacy by design** — toda coleta nova exige justificativa baseada em finalidade legítima
2. **Least privilege** — cada chave, role e função tem o mínimo de permissão necessária. `service_role` nunca toca o client
3. **Defense in depth** — validação no client, validação no server, RLS no banco. Nenhuma camada confia nas anteriores

---

## 2. Conformidade com a LGPD (Lei 13.709/2018)

O Spotlight é **controlador** (art. 5º, VI). Toda decisão de produto respeita os princípios do art. 6º: finalidade, adequação, necessidade, livre acesso, qualidade, transparência, segurança, prevenção, não discriminação e responsabilização.

### Base legal para tratamento (art. 7º)

- **Email + id do Supabase Auth:** consentimento explícito ao criar conta (art. 7º, I)
- **Favoritos e watchlist:** execução de contrato (art. 7º, V)
- **Logs técnicos com hash de IP:** legítimo interesse para segurança (art. 7º, IX)
- **Não coletamos dados sensíveis** (art. 5º, II): raça, religião, política, saúde, biometria, vida sexual
- **Não coletamos dados de menores de 18** — adicionar checkbox de confirmação no cadastro (art. 14)

### Direitos do titular (art. 18) — implementar na página `/conta`

- **I — Confirmação e II — Acesso:** página `/conta` lista tudo + `GET /api/account/export` devolve JSON
- **III — Correção:** edição de email via Supabase Auth UI
- **V — Portabilidade:** mesmo endpoint de export entrega formato estruturado
- **VI — Eliminação e IX — Revogação:** rota `DELETE /api/account` apaga tudo em cascata
- **VII — Compartilhamento:** página `/privacidade` lista operadores (TMDB, RapidAPI, Supabase, Vercel, Upstash)
- **Prazo de resposta:** 15 dias (art. 19, §1º). Implementar de forma automática, sem operador humano

### Encarregado (DPO) e incidentes

- Email do encarregado em `NEXT_PUBLIC_DPO_EMAIL`, publicado em `/privacidade` (art. 41, §1º) e no `SECURITY.md`
- Incidente de segurança (art. 48): comunicar ANPD em até 3 dias úteis (recomendação ANPD) + titulares afetados. Processo documentado no `SECURITY.md`

### Transferência internacional

TMDB, RapidAPI, Vercel e Upstash são operadores fora do Brasil. Coberto pelo art. 33, II (execução de contrato) e art. 33, VIII (consentimento específico declarado na política).

---

## 3. Autenticação e autorização

### Supabase Auth

- Magic link (passwordless) + OAuth Google + OAuth GitHub. Sem senha tradicional — elimina credential stuffing
- Cookies de sessão: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`
- `createServerClient` do `@supabase/ssr` em todo código server-side; middleware renova token a cada request

### Hierarquia de chaves Supabase

| Chave                                 | Onde pode aparecer                          | Onde **nunca** pode aparecer                                                      |
| ------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| `SUPABASE_ANON_KEY` (`NEXT_PUBLIC_*`) | Client, server                              | —                                                                                 |
| `SUPABASE_SERVICE_ROLE_KEY`           | Edge Functions, `src/lib/supabase/admin.ts` | Client, qualquer arquivo com `'use client'`, qualquer rota pública sem auth check |

Adicionar no topo de `src/lib/supabase/admin.ts`:

```ts
// SERVER-ONLY — service_role tem acesso total ao banco e ignora RLS.
// Nunca importar do client, nunca expor em route handler público sem auth check.
import 'server-only'
```

---

## 4. Row Level Security (RLS)

**RLS habilitado em TODAS as tabelas do schema `public`, sem exceção.** Nenhuma tabela vai pra produção sem policy.

### Matriz de policies

| Tabela                                                                                       | SELECT                 | INSERT                 | UPDATE                 | DELETE                 |
| -------------------------------------------------------------------------------------------- | ---------------------- | ---------------------- | ---------------------- | ---------------------- |
| `movies`, `people`, `movie_cast`, `movie_crew`, `movie_ratings`, `movie_streaming`, `genres` | público (anônimo OK)   | `service_role`         | `service_role`         | `service_role`         |
| `user_favorites`                                                                             | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `user_watchlist`                                                                             | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `sync_logs`                                                                                  | `service_role`         | `service_role`         | `service_role`         | `service_role`         |

### Testes obrigatórios

Em `tests/rls/`, escrever testes SQL que provem que cada policy funciona. Mínimo:

- Usuário anônimo consegue SELECT em `movies`
- Usuário anônimo **falha** ao INSERT em `movies`
- Usuário A consegue SELECT só nos próprios `user_favorites`
- Usuário A **falha** ao SELECT em `user_favorites` de usuário B
- Usuário A **falha** ao INSERT em `user_favorites` com `user_id` de outro
- Anônimo **falha** ao SELECT em `sync_logs`

Esses testes rodam no CI a cada PR.

---

## 5. Variáveis de ambiente

### Validação Zod no boot

`src/env.ts` valida toda env no startup. App **não inicia** se faltar ou tiver formato inválido. Envs obrigatórias incluem URL e chaves do Supabase, `TMDB_API_KEY`, `RAPIDAPI_KEY` + host, Upstash Redis (URL + token), `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_DPO_EMAIL`. Todas as não-`NEXT_PUBLIC_*` são server-only.

### Regras

- `.env.local` no `.gitignore` desde o **primeiro commit**
- `.env.example` com todas as chaves, sem valores reais, com comentário explicando cada uma
- Deploy: configurar via Vercel Environment Variables com escopo correto (Production / Preview / Development)
- **Nunca** logar valor de env, nem em erro, nem em telemetria
- Rotação anual obrigatória de todas as chaves de API externa

---

## 6. Headers e proteções HTTP

### Content Security Policy (CSP)

Configurada em `next.config.ts`, estrita:

- `default-src 'self'`
- `script-src 'self' 'nonce-{random}'` — Vercel Analytics se necessário
- `style-src 'self' 'unsafe-inline'` — Tailwind exige inline
- `img-src 'self' image.tmdb.org` + domínios de logos de streaming (Netflix, Prime, etc.)
- `connect-src 'self'` + URL do Supabase + host do RapidAPI
- `frame-ancestors 'none'`
- `form-action 'self'`

### Headers obrigatórios (middleware)

`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`.

### HTTPS

- Redirect HTTP → HTTPS forçado no middleware
- HSTS preload-ready
- Vercel cuida do cert TLS, mas configurar `https://` em todos os callbacks OAuth

### CORS

- Edge Functions com CORS explícito apontando apenas para `NEXT_PUBLIC_SITE_URL`
- **Nunca** usar `Access-Control-Allow-Origin: *`

---

## 7. Rate limiting e validação de input

### Rate limiting (`@upstash/ratelimit`)

| Rota / Action                  | Limite     | Chave              |
| ------------------------------ | ---------- | ------------------ |
| `GET /api/search`              | 30 req/min | hash SHA-256 do IP |
| `POST /api/account` (DELETE)   | 3 req/hora | `auth.uid()`       |
| `GET /api/account/export`      | 5 req/hora | `auth.uid()`       |
| Server Action `toggleFavorite` | 30 req/min | `auth.uid()`       |
| Server Action `addToWatchlist` | 30 req/min | `auth.uid()`       |

IP **nunca** é armazenado em texto cheio. Sempre hash antes de usar como chave (mesmo em memória de curta duração).

### Validação de input

- Toda Server Action passa por `next-safe-action` com schema Zod
- Toda rota API valida `searchParams`, `body` e `headers` com Zod
- Buscas: parametrizar via Supabase query builder, **nunca** concatenar string
- Comprimento máximo de query de busca: **200 caracteres**
- Sanitizar caracteres de controle antes de persistir ou indexar
- Rejeitar requests com `Content-Length` acima de 10kb em rotas que não recebem upload

---

## 8. Privacidade do usuário — detalhes técnicos

### Coleta mínima

Armazenamos **apenas** `auth.users.id` (uuid), `auth.users.email`, provider OAuth se houver, e as relações `user_favorites` / `user_watchlist`. **Não coletamos:** nome, telefone, endereço, CPF, data de nascimento, foto, gênero, localização, device fingerprint, comportamento de navegação.

### Sem tracking de terceiros

- Sem Google Analytics, sem Meta Pixel, sem Hotjar, sem qualquer pixel de marketing
- Vercel Analytics é aceitável **apenas** se modo anônimo confirmado (sem cookies, sem fingerprinting)
- Sem cookies de tracking — só cookies essenciais de sessão Supabase

### Página `/privacidade`

Em linguagem clara, conter: (1) controlador e contato do encarregado; (2) dados coletados e finalidade; (3) base legal de cada tratamento (art. 7º); (4) operadores e localização (Supabase, Vercel, TMDB, RapidAPI, Upstash); (5) direitos do titular (art. 18) e como exercê-los; (6) prazo de retenção (dados ativos enquanto a conta existir, logs técnicos 30 dias); (7) política de cookies (apenas essenciais); (8) processo de atualização; (9) data da última revisão.

### Logs sem PII

- **Nunca** logar email, IP em texto cheio, conteúdo de busca identificável, valor de cookie ou token
- Erros do servidor: logar `error.message` e `stack`, nunca o objeto request inteiro
- `sync_logs` registra apenas dados técnicos de operação. Retenção máxima de 30 dias com policy de auto-delete

---

## 9. Higiene de repositório e CI

### Pre-commit (husky + lint-staged)

- ESLint
- Prettier
- `tsc --noEmit`
- Bloqueia commit se algum falhar

### CI no GitHub Actions

A cada PR e push em `main`: lint, type-check, testes unitários (Vitest), testes RLS (SQL), build de produção, `npm audit --audit-level=high` (falha em high/critical), **gitleaks** (falha se detectar secret) e Playwright e2e (smoke do fluxo principal).

### Dependências

- Renovate ou Dependabot ativo, PR automático para atualizações de segurança
- Antes de adicionar dependência nova: verificar tamanho, manutenção (último commit), licença e número de downloads. Justificar no `implementation_plan.md`
- Pin de versões em `package.json` (`^` permitido apenas em devDependencies)

### Conventional Commits

Obrigatório via `commitlint`. Tipos permitidos: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `perf`, `style`, `security`.

---

## 10. Ações proibidas pro agente Antigravity

O agente **não pode** executar sem confirmação explícita no chat:

- Desabilitar ou modificar policy de RLS já existente
- Adicionar dependência nova
- Mover lógica de `lib/supabase/admin.ts` para arquivo client ou rota pública
- Adicionar tracker de terceiros (analytics, pixel, fingerprinting)
- Logar IP, email ou conteúdo de busca em texto cheio
- Criar rota API sem rate limit
- Criar Server Action sem `next-safe-action` + Zod
- Criar migration que crie tabela sem habilitar RLS na mesma migration ou imediatamente na seguinte
- Modificar CSP ou remover header de segurança
- Commitar `.env*` ou arquivo com secret
- Implementar "deletar conta" sem cascata real (deve apagar `user_favorites`, `user_watchlist` e chamar `supabase.auth.admin.deleteUser()`)

---

## 11. Checklist antes de cada deploy

- [ ] RLS habilitado em todas as tabelas e testes RLS passando
- [ ] Nenhum `service_role` em código client ou rota pública
- [ ] `src/env.ts` valida todas envs e app falha cedo se faltar
- [ ] `.env.local` no `.gitignore`, `.env.example` atualizado
- [ ] CSP, HSTS e demais headers configurados
- [ ] Rate limit em todas as rotas API e Server Actions
- [ ] Toda Server Action com `next-safe-action` + Zod
- [ ] Toda rota API com validação Zod no body/query
- [ ] Rotas de exclusão e exportação de conta funcionando
- [ ] Página `/privacidade` publicada e atualizada
- [ ] Email do encarregado configurado e visível
- [ ] Logs auditados — sem PII em texto cheio
- [ ] `npm audit` sem high/critical
- [ ] gitleaks limpo
- [ ] CSP testada com browser real (Console sem erros bloqueando funcionalidade)
- [ ] Backups do Supabase habilitados
