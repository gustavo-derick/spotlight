-- Row Level Security em todas as tabelas do schema public.
-- Regra geral:
--   Catálogo (movies, people, etc.): SELECT público; escritas apenas via service_role
--   Usuário (user_favorites, user_watchlist): acesso restrito ao próprio auth.uid()
--   Internos (sync_logs, rate_limits): apenas service_role (nenhuma policy = sem acesso)

-- ─── Catálogo — somente leitura pública ──────────────────────────────────────

ALTER TABLE movies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE people          ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_cast      ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_crew      ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_ratings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_streaming ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres          ENABLE ROW LEVEL SECURITY;

-- SELECT público (anon e authenticated); INSERT/UPDATE/DELETE sem policy = bloqueado
CREATE POLICY "movies_select_public"
  ON movies FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "people_select_public"
  ON people FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "movie_cast_select_public"
  ON movie_cast FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "movie_crew_select_public"
  ON movie_crew FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "movie_ratings_select_public"
  ON movie_ratings FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "movie_streaming_select_public"
  ON movie_streaming FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "genres_select_public"
  ON genres FOR SELECT TO anon, authenticated
  USING (true);

-- ─── Dados de usuário — isolados por auth.uid() ───────────────────────────────

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_favorites_own_select"
  ON user_favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_favorites_own_insert"
  ON user_favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_favorites_own_delete"
  ON user_favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_watchlist_own_select"
  ON user_watchlist FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_watchlist_own_insert"
  ON user_watchlist FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_watchlist_own_update"
  ON user_watchlist FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_watchlist_own_delete"
  ON user_watchlist FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── Tabelas internas — nenhuma policy (service_role bypassa RLS) ─────────────

ALTER TABLE sync_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Sem policies = nenhum role (exceto service_role) consegue acessar
