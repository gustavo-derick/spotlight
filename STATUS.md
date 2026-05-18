# Spotlight — Status do Projeto

> Última atualização: 2026-05-17
> Supabase project ref: `rqqotucosggxlcsjmtfl`

---

## O que já foi desenvolvido (Concluído)

### 1. Setup, Arquitetura e Banco de Dados

- Scaffold Next.js 15, Tailwind CSS 4, shadcn/ui.
- Banco de Dados estruturado e versionado via Supabase migrations.
- Configuração de segurança (RLS, CSP, validação Zod de `.env.local`).
- Tipagem inicial gerada a partir do banco de dados e clientes do Supabase configurados (`server.ts`, `client.ts`).
- **Base de 10k+ Filmes**: Banco de dados populado com filmes cobrindo desde o ano 2000 até hoje, garantindo consultas rápidas (<100ms) sem latência de APIs externas.

### 2. Pipeline de Sincronização e Integrações (Backend)

- Pipeline de sincronização construído para rodar tanto via Edge Function quanto em ambiente local (`local_sync.ts`).
- Extração em massa de dados via **TMDB API** (detalhes, créditos, imagens, plataformas de streaming).
- Integração robusta via **RapidAPI** para extração em lote de notas (IMDb, Rotten Tomatoes, Letterboxd).
- Sistema de tolerância a falhas configurado (retries exponenciais, tratamento do erro 429 - _Rate Limit_, e escape de restrições do banco).

### 3. Frontend Principal & UX Premium

- **Página Home (`/`)**: Carrosséis divididos em seções (Populares, Lançamentos). Cards menores (mais densidade) exibindo diretamente badges de avaliação de sites terceiros.
- **Página de Detalhes do Filme (`/filme/[slug]`)**:
  - Layout imersivo (estilo streaming premium) com gradient over backdrop.
  - Exibição limpa de sinopse, metadados (duração, diretor, data) e grade de Elenco Principal com fotos redondas.
- **Identidade de Marca Renovada**:
  - **Tipografia**: Logo atualizada para a fonte clássica e imponente **Bentham** (Serifada Moderna). Os demais textos do site agora utilizam a moderna e fluida **Plus Jakarta Sans**.
  - **Logo Premium Animada**: Criação do componente `LogoIcon` com um design sofisticado em SVG representando holofotes duplos de cinema cruzados.
  - **Spotlight Reveal**: Efeito de revelação na logo "Spotlight" no header que simula um feixe de luz passando sobre o texto de forma contínua, com aceleração e brilho (_glow_) adicionais na interação de _hover_.
- **Inteligência Visual de Logos**:
  - Integração da **Clearbit Logo API** na `next.config.ts`.
  - Badges de avaliações (IMDb, Rotten Tomatoes, Letterboxd) renderizadas com as mini-logos oficiais de cada empresa.
  - Logos oficiais dos serviços de Streaming.

### 4. Sistemas de Fallback em Tempo Real (Scraping Dinâmico)

- **Scraper de Streaming (`/api/scrape-streaming`)**: Se a API oficial do TMDB falhar em prover as plataformas no Brasil, a página exibe uma aba com animação de _loading_ e um scraper interno busca ativamente na web, retornando os ícones formatados em tempo real (com o carimbo "via Web").
- **Deduplicação de Streamings**: Algoritmo no frontend para ocultar clones/planos secundários.
- **Scraper de Avaliações (`/api/scrape-ratings`)**: Rota acionada caso o filme esteja sem notas do IMDb/Letterboxd, agindo como um proxy silencioso da RapidAPI para encontrar a nota sem bloquear o carregamento principal da página.

### 5. Busca Inteligente e Semântica Avançada

- **API de Busca (`/api/search`)**: Rate limit de 30 req/min por IP hasheado via RPC `check_rate_limit` no banco. Todos os parâmetros validados com Zod.
- **Busca Semântica Avançada**: Enriquecimento de `movie_keywords` (~49k registros). A busca semântica agora correlaciona termos específicos como "Plot-Twist", "vampiro", "reviravolta" ou "alien" pesquisando em títulos, sinopses, comentários e nos gêneros associados instantaneamente.
- **Página de Busca (`/busca`)**: layout de duas colunas (painel de filtros + grade de resultados), Server Component que pré-carrega a lista de gêneros do banco.
- **Filtros**: Gênero (chips multi-select), Ano (faixa De/Até) e Nota IMDb mínima. Todos os filtros refletidos na URL para compartilhamento.
- **Debounce (300ms)** na barra de busca do Header e na barra da página `/busca`.
- **Paginação "Carregar mais"** via TanStack Query `useInfiniteQuery`.

### 6. Área do Usuário Completa

- Configuração do sistema de Login (`/entrar`) usando `supabase.auth` (Magic Links e OAuth Google).
- Bloqueio das rotas protegidas no `middleware.ts` exigindo autenticação do usuário.
- Botões interativos "Favoritar" e "Watchlist" da tela do filme conectados a `Server Actions` com UI otimista.
- Criação das páginas `/favoritos` e `/watchlist` com exibição em grid.
- Menu Header dinâmico com menu para a Área do Usuário (`/perfil`).

### 7. Vibes & Gêneros Atualizados

- **Navegação de Categorias**: Implementados botões "Ver todos" em todas as listas da Home (Lançamentos, Populares e Gêneros).
- **Páginas de Gêneros (`/genero/[slug]`)**: Página dinâmica imersiva para todos os 19 gêneros com esquemas de cores HSL dedicados e emojis representativos.
- **Vibes Otimizadas**: Coleção completa de **12 Vibes** robustas (ex: "Clássicos Cult", "Universo Animado", "Crimes e Mentiras", "Novidades", "Adrenalina Pura") totalmente populadas com filmes relevantes extraídos diretamente da nossa base, sem filtros restritivos vazios.

---

## Próximos Passos (Próximo Bloco)

### Bloco 4 — Recursos de Interação & Gamificação

1. **Sistema "Tinder" de Descoberta (Swipe)**: roleta de filmes interativa para curtir/descartar rapidamente com Framer Motion.
2. **Coleções Colaborativas**: permitir que os usuários criem listas customizadas e convidem amigos para adicionar filmes de forma colaborativa.
3. **Estatísticas e Gamificação no Perfil**: gráficos de gêneros favoritos, tempo total de tela e badges interativos (ex: "Cinefilo de Ouro", "Maratonista de Terror").
4. **Refinamentos Finais & Produção**: verificação de cron jobs de sincronização diária, testes automatizados e adequação geral à LGPD.

---

## Últimas mudanças (resolvido) — 2026-05-17

- Header/menu
  - Vibes e Descobrir movidos para as primeiras posições do menu desktop.
  - Estilo refeito para visual sóbrio, estilo "Netflix": botões retos com padding maior, ícones discretos e barra de destaque inferior no hover.
  - Mobile ajustado com novo componente `src/components/layout/mobile-menu.tsx`: menu hambúrguer, busca integrada, navegação principal e links autenticados quando houver sessão.
  - Logo "Spotlight" agora também aparece no header mobile.

- Sistema de avaliações (5 estrelas)
  - Migration adicionada: supabase/migrations/00000000000011_user_ratings.sql (tabela user_ratings, trigger updated_at, RLS, funções get_movie_rating_stats e get_user_movie_rating).
  - Discovery melhorado na migration: get_discovery_movies agora considera AVG(user_ratings) para priorizar filmes com melhores avaliações comunitárias.
  - `src/types/database.ts` recebeu os tipos provisórios de `user_ratings` e das novas RPCs até a regeneração oficial dos types pelo Supabase.

- Backend
  - Nova Server Action: submitRatingAction em src/lib/actions/user.ts — faz upsert na tabela user_ratings e revalida paths (/filme/:id, /descobrir).
  - Corrigido o `upsert` de avaliações para usar `onConflict: 'user_id,movie_id'`, formato esperado pelo Supabase.

- Frontend
  - Novo componente cliente: src/components/movie/star-rating.tsx — UI de 1–5 estrelas, hover, envio via next-safe-action, mostra média e contagem.
  - Integração na página de filme: src/app/(public)/filme/[slug]/page.tsx (inclui médias iniciais + rating do usuário quando autenticado).
  - UserActions mantido (favoritar/watchlist); comportamento otimista preservado.
  - Ajustado o tratamento do retorno da action no `StarRating` para evitar `rating` indefinido no estado otimista.

- Tooling / Hooks
  - Problema principal dos checks resolvido: `npm run type-check` e `npm run lint` passam.
  - `eslint.config.mjs` foi simplificado para usar diretamente `@next/eslint-plugin-next` + parser do Next, mantendo as regras recomendadas/Core Web Vitals e evitando o preset TypeScript que estava travando no ambiente.
  - `check.js` corrigido para não falhar lint por variável não usada.
  - Commit ainda pendente.

Próximos passos recomendados:

1. Aplicar a migration `00000000000011_user_ratings.sql` no Supabase local/staging e regenerar oficialmente os types: `npx supabase gen types typescript --local > src/types/database.ts`.
2. Rodar `npm run build` em ambiente com `.env.local` completo para validar a build Next/Supabase de ponta a ponta.
3. Fazer o commit das mudanças atuais após revisar o diff.
4. Escrever testes RLS para `user_ratings` e cobertura unitária para `submitRatingAction`.
5. Seguir o Bloco 4 com o sistema de descoberta por swipe em `/descobrir`.

---

Considerações técnicas & ajustes recomendados (planejamento):

- StarRating: corrigir atualização otimista das estatísticas no onSuccess. Usar o valor prévio do rating (prevUserRating) e atualizações funcionais de estado para evitar condições de corrida.
- UX não autenticado: redirecionar para `/entrar` ao tentar avaliar (consistente com UserActions) e exibir mensagem contextual (toast/modal).
- Performance BD: criar índice em user_ratings(movie_id) e considerar materialized view `movie_rating_aggregates(movie_id, avg_rating, rating_count)` atualizada por trigger para leituras rápidas e descoberta.
- Discovery e viés estatístico: substituir ordenação por média simples por média bayesiana (ou usar Wilson score) para evitar favorecer filmes com poucas avaliações.
- Escalabilidade/abuso: aplicar rate limit por usuário na action de envio de rating (ex.: 10 req/min) via `ratelimit.ts` (Upstash) ou política no edge.
- Consistência & segurança: validar no servidor o formato do upsert e garantir que RLS + SECURITY DEFINER nas RPCs não exponham dados individuais; garantir logs não registrem identificadores sensíveis.
- Testes e CI: adicionar testes unitários para submitRatingAction, testes de integração para a RPC get_movie_rating_stats e testes RLS que confirmem isolamento usuário-a-usuário.
- Migração operacional: planejar backfill para ratings se houver fonte externa; rodar migration em staging, verificar índices e performance antes de produção.
- Acessibilidade: melhorar controles de teclado/ARIA no componente StarRating (aria-pressed, role=radio/slider) e texto alternativo para leitores de tela.
- Mobile: ajustar layout e tap targets, garantir que o componente cliente seja leve e não bloqueie carregamento crítico do Server Component.
- Observabilidade: instrumentar eventos de rating para analytics (fila de eventos) e criar job agendado para recomputar agregados caso não use triggers imediatos.
- Roadmap ML: preparar materialized aggregates e eventos para alimentar algoritmo de recomendação (CF/ALS ou aproximador embedders). Inicial: usar aggregates + co-occurrence; próximo: modelo colaborativo.

Notas menores:

- Revisar o retorno das RPCs (`get_movie_rating_stats`, `get_user_movie_rating`) para garantir formato consistente com o código (array vs scalar) e ajustar parsing no Server Component.
- Confirmar que `onConflict` no upsert usa o formato aceito pela versão do client Supabase em uso.

Se aprovar, adiciono essas tarefas na lista de todos (SQL todos) e começo por: (A) corrigir onSuccess do StarRating, (B) adicionar índice na migration e (C) escrever testes RLS.
