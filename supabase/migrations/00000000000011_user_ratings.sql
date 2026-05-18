-- Create table for user-provided 1-5 star ratings

CREATE TABLE user_ratings (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid        NOT NULL REFERENCES movies(id)     ON DELETE CASCADE,
  rating     smallint    NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, movie_id)
);

-- Triggers to maintain updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_ratings_updated_at
BEFORE UPDATE ON user_ratings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Enable RLS and policies: users can manage their own ratings, individual rows are private
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_ratings_own_select"
  ON user_ratings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_ratings_own_insert"
  ON user_ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_ratings_own_update"
  ON user_ratings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_ratings_own_delete"
  ON user_ratings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Public aggregated view/function: average and count per movie (exposes no user identifiers)
CREATE OR REPLACE FUNCTION get_movie_rating_stats(p_movie_id uuid)
RETURNS TABLE(avg_rating numeric, rating_count int) AS $$
BEGIN
  RETURN QUERY
  SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*)::int as rating_count
  FROM user_ratings ur
  WHERE ur.movie_id = p_movie_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a single user's rating for a movie (used server-side)
CREATE OR REPLACE FUNCTION get_user_movie_rating(p_user_id uuid, p_movie_id uuid)
RETURNS smallint AS $$
DECLARE
  v_rating smallint;
BEGIN
  SELECT rating INTO v_rating FROM user_ratings WHERE user_id = p_user_id AND movie_id = p_movie_id;
  RETURN v_rating;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improve discovery function to factor in community ratings (avg) while still adding randomness
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
  ORDER BY COALESCE((SELECT AVG(rating) FROM user_ratings ur WHERE ur.movie_id = m.id), 0) DESC, random()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
