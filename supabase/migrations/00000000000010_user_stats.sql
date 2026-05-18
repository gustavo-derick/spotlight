CREATE OR REPLACE FUNCTION get_user_profile_stats(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_movies integer;
  v_total_runtime integer;
  v_favorite_genres jsonb;
BEGIN
  -- Total de filmes e tempo assistido a partir dos favoritos
  SELECT 
    COUNT(m.id), 
    COALESCE(SUM(m.runtime), 0)
  INTO 
    v_total_movies, 
    v_total_runtime
  FROM user_favorites uf
  JOIN movies m ON uf.movie_id = m.id
  WHERE uf.user_id = target_user_id;

  -- Agregação dos 5 gêneros mais assistidos
  SELECT COALESCE(jsonb_agg(genre_stats), '[]'::jsonb)
  INTO v_favorite_genres
  FROM (
    SELECT 
      g.name_pt as name,
      COUNT(*) as count
    FROM user_favorites uf
    JOIN movies m ON uf.movie_id = m.id
    JOIN LATERAL unnest(m.genres) as genre_id ON true
    JOIN genres g ON g.tmdb_id = genre_id
    WHERE uf.user_id = target_user_id
    GROUP BY g.name_pt
    ORDER BY count DESC
    LIMIT 5
  ) as genre_stats;

  RETURN jsonb_build_object(
    'total_movies', v_total_movies,
    'total_runtime', v_total_runtime,
    'favorite_genres', v_favorite_genres
  );
END;
$$;
