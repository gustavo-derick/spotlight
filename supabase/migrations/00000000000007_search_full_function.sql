-- Função de busca completa: texto, gênero, ano e nota mínima IMDb em uma única query.
-- Agrega as avaliações de todas as fontes como JSONB para evitar N+1 queries no frontend.

CREATE OR REPLACE FUNCTION search_movies_full(
  p_query          text      DEFAULT '',
  p_genre_ids      integer[] DEFAULT NULL,
  p_year_from      integer   DEFAULT NULL,
  p_year_to        integer   DEFAULT NULL,
  p_min_imdb_score numeric   DEFAULT NULL,
  p_limit          integer   DEFAULT 20,
  p_offset         integer   DEFAULT 0
)
RETURNS TABLE(
  id             uuid,
  title_pt       text,
  title_original text,
  poster_url     text,
  release_date   date,
  genres         integer[],
  ratings        jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.title_pt,
    m.title_original,
    m.poster_url,
    m.release_date,
    m.genres,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('source', r.source, 'score', r.score)
        ORDER BY r.source
      ) FILTER (WHERE r.id IS NOT NULL),
      '[]'::jsonb
    ) AS ratings
  FROM movies m
  LEFT JOIN movie_ratings r ON r.movie_id = m.id
  WHERE
    (
      p_query = ''
      OR (
        length(p_query) <= 200
        AND (
          m.title_pt       ILIKE '%' || p_query || '%'
          OR m.title_original ILIKE '%' || p_query || '%'
          OR similarity(m.title_pt,       p_query) > 0.2
          OR similarity(m.title_original, p_query) > 0.2
        )
      )
    )
    AND (p_genre_ids      IS NULL OR m.genres && p_genre_ids)
    AND (p_year_from      IS NULL OR m.release_date >= make_date(p_year_from, 1,  1))
    AND (p_year_to        IS NULL OR m.release_date <= make_date(p_year_to,   12, 31))
    AND (
      p_min_imdb_score IS NULL
      OR EXISTS (
        SELECT 1 FROM movie_ratings imdb
        WHERE imdb.movie_id = m.id
          AND imdb.source   = 'imdb'
          AND imdb.score   >= p_min_imdb_score
      )
    )
  GROUP BY m.id, m.title_pt, m.title_original, m.poster_url, m.release_date, m.genres
  ORDER BY
    CASE WHEN p_query <> ''
      THEN greatest(
        similarity(m.title_pt,       p_query),
        similarity(m.title_original, p_query)
      )
      ELSE 0
    END DESC,
    m.release_date DESC NULLS LAST
  LIMIT  least(p_limit, 100)
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION search_movies_full TO anon, authenticated;
