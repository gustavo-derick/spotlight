-- Índices de performance.
-- Trigram (GIN) para busca por similaridade de texto.
-- Btree para filtros e joins frequentes.

-- ─── Busca textual ────────────────────────────────────────────────────────────

-- Requer pg_trgm (habilitado na migration 00001)
CREATE INDEX movies_title_pt_trgm_idx
  ON movies USING gin (title_pt gin_trgm_ops);

CREATE INDEX movies_title_original_trgm_idx
  ON movies USING gin (title_original gin_trgm_ops);

-- ─── Filtros e ordenação ──────────────────────────────────────────────────────

CREATE INDEX movies_release_date_idx
  ON movies (release_date DESC NULLS LAST);

-- Já definido como UNIQUE na criação da tabela, mas index explícito para clareza
CREATE INDEX movies_imdb_id_idx
  ON movies (imdb_id);

CREATE INDEX movies_genres_idx
  ON movies USING gin (genres);

-- ─── Joins frequentes ────────────────────────────────────────────────────────

CREATE INDEX movie_cast_person_id_idx
  ON movie_cast (person_id);

CREATE INDEX movie_cast_movie_id_order_idx
  ON movie_cast (movie_id, "order");

CREATE INDEX movie_crew_person_id_idx
  ON movie_crew (person_id);

CREATE INDEX movie_ratings_movie_id_idx
  ON movie_ratings (movie_id);

CREATE INDEX movie_streaming_movie_id_region_idx
  ON movie_streaming (movie_id, region);

-- ─── Rate limiting ────────────────────────────────────────────────────────────

CREATE INDEX rate_limits_window_start_idx
  ON rate_limits (window_start);
