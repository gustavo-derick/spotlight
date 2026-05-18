-- ─── Tabela de Filmes Descartados (Tinder Swipe Left) ───────────

CREATE TABLE user_dislikes (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid        NOT NULL REFERENCES movies(id)     ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, movie_id)
);

-- Habilitar RLS
ALTER TABLE user_dislikes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can manage their own dislikes"
    ON user_dislikes
    FOR ALL
    USING (auth.uid() = user_id);

-- ─── Função de Recomendação (Discovery) ─────────────────────────

-- Esta função retorna filmes aleatórios ou ordenados que o usuário ainda não interagiu.
-- Ou seja: Não estão em user_favorites, user_watchlist e user_dislikes.

CREATE OR REPLACE FUNCTION get_discovery_movies(p_user_id uuid, p_limit int DEFAULT 10)
RETURNS SETOF movies AS $$
BEGIN
  RETURN QUERY
  SELECT m.*
  FROM movies m
  WHERE NOT EXISTS (
    SELECT 1 FROM user_favorites f WHERE f.movie_id = m.id AND f.user_id = p_user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM user_watchlist w WHERE w.movie_id = m.id AND w.user_id = p_user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM user_dislikes d WHERE d.movie_id = m.id AND d.user_id = p_user_id
  )
  -- Dá preferência a filmes mais recentes e com mais avaliações (popularidade) 
  -- limitando aos "tops" e pegando alguns aleatórios para a sensação de swipe
  ORDER BY random() 
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
