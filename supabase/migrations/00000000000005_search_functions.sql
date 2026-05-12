-- Funções RPC expostas via Supabase PostgREST.
-- SECURITY DEFINER: executam com permissão do owner (service_role),
-- contornando RLS apenas onde necessário e com validação explícita de inputs.

-- ─── Busca de filmes ──────────────────────────────────────────────────────────

/**
 * search_movies — busca textual + filtro por gênero com paginação.
 *
 * Combina ILIKE (prefixo rápido) com similarity trigram para tolerância a erros.
 * Comprimento de query limitado a 200 chars conforme requisito de segurança.
 *
 * @param p_query       texto de busca (máx 200 chars)
 * @param p_genre_ids   array de tmdb_id de gêneros para filtrar (NULL = todos)
 * @param p_limit       máximo de resultados (cap: 100)
 * @param p_offset      deslocamento para paginação
 */
CREATE OR REPLACE FUNCTION search_movies(
  p_query     text,
  p_genre_ids integer[] DEFAULT NULL,
  p_limit     integer   DEFAULT 20,
  p_offset    integer   DEFAULT 0
)
RETURNS SETOF movies
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM   movies
  WHERE  length(p_query) <= 200
    AND  (
           title_pt       ILIKE '%' || p_query || '%'
        OR title_original ILIKE '%' || p_query || '%'
        OR similarity(title_pt,       p_query) > 0.2
        OR similarity(title_original, p_query) > 0.2
         )
    AND  (p_genre_ids IS NULL OR genres && p_genre_ids)
  ORDER BY
         greatest(
           similarity(title_pt,       p_query),
           similarity(title_original, p_query)
         ) DESC,
         release_date DESC NULLS LAST
  LIMIT  least(p_limit, 100)
  OFFSET p_offset;
$$;

-- Expõe a função para roles não-autenticados (SELECT público do catálogo)
GRANT EXECUTE ON FUNCTION search_movies TO anon, authenticated;

-- ─── Rate limiting atômico ────────────────────────────────────────────────────

/**
 * check_rate_limit — verifica e incrementa contador de rate limit.
 *
 * Operação atômica via upsert: insere novo registro ou incrementa contador
 * dentro da janela. Retorna true se a requisição está dentro do limite.
 * Reseta a janela automaticamente quando expirada.
 *
 * @param p_key              identificador único (IP hasheado + rota, ou user_id + rota)
 * @param p_max_requests     limite de requisições por janela
 * @param p_window_seconds   duração da janela em segundos
 */
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key            text,
  p_max_requests   integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count          integer;
  v_now            timestamptz := now();
  v_window_cutoff  timestamptz := v_now - (p_window_seconds || ' seconds')::interval;
BEGIN
  INSERT INTO rate_limits (key, count, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO UPDATE SET
    count        = CASE
                     WHEN rate_limits.window_start < v_window_cutoff THEN 1
                     ELSE rate_limits.count + 1
                   END,
    window_start = CASE
                     WHEN rate_limits.window_start < v_window_cutoff THEN v_now
                     ELSE rate_limits.window_start
                   END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max_requests;
END;
$$;

-- Não expõe check_rate_limit a roles públicos — chamada apenas via service_role

-- ─── Limpeza automática de rate_limits expirados ─────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '1 hour';
$$;

-- ─── Limpeza automática de sync_logs > 30 dias ───────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_sync_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM sync_logs
  WHERE started_at < now() - interval '30 days';
$$;
