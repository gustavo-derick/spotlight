-- Schema principal do Spotlight.
-- Enums criados antes das tabelas que os referenciam.

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE rating_source AS ENUM ('imdb', 'rotten_tomatoes', 'letterboxd');
CREATE TYPE streaming_type AS ENUM ('flatrate', 'rent', 'buy', 'ads');
CREATE TYPE sync_status    AS ENUM ('started', 'success', 'error');

-- ─── Catálogo de filmes ───────────────────────────────────────────────────────

CREATE TABLE movies (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id          integer     NOT NULL,
  -- imdb_id é a chave usada pela API de ratings (RapidAPI)
  imdb_id          text        NOT NULL,
  title_pt         text        NOT NULL,
  title_original   text        NOT NULL,
  original_language text       NOT NULL DEFAULT 'en',
  overview_pt      text,
  release_date     date,
  runtime          integer,    -- minutos
  poster_url       text,
  backdrop_url     text,
  genres           integer[]   NOT NULL DEFAULT '{}',
  last_synced_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT movies_tmdb_id_unique UNIQUE (tmdb_id),
  CONSTRAINT movies_imdb_id_unique UNIQUE (imdb_id),
  CONSTRAINT movies_imdb_id_format CHECK (imdb_id ~ '^tt\d{7,}$'),
  CONSTRAINT movies_runtime_positive CHECK (runtime IS NULL OR runtime > 0)
);

CREATE TABLE people (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id     integer NOT NULL,
  name        text    NOT NULL,
  profile_url text,
  known_for   text,

  CONSTRAINT people_tmdb_id_unique UNIQUE (tmdb_id)
);

CREATE TABLE movie_cast (
  movie_id  uuid    NOT NULL REFERENCES movies(id)  ON DELETE CASCADE,
  person_id uuid    NOT NULL REFERENCES people(id)  ON DELETE CASCADE,
  character text,
  "order"   integer NOT NULL DEFAULT 0,

  PRIMARY KEY (movie_id, person_id)
);

CREATE TABLE movie_crew (
  movie_id  uuid NOT NULL REFERENCES movies(id)  ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES people(id)  ON DELETE CASCADE,
  job       text NOT NULL,

  PRIMARY KEY (movie_id, person_id, job)
);

-- ─── Ratings e streamings ─────────────────────────────────────────────────────

CREATE TABLE movie_ratings (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id   uuid          NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  source     rating_source NOT NULL,
  score      numeric(5,2)  NOT NULL,
  score_max  numeric(5,2)  NOT NULL,
  votes      integer,
  url        text,
  fetched_at timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT movie_ratings_movie_source_unique UNIQUE (movie_id, source),
  CONSTRAINT movie_ratings_score_range CHECK (score >= 0 AND score <= score_max),
  CONSTRAINT movie_ratings_score_max_positive CHECK (score_max > 0)
);

CREATE TABLE movie_streaming (
  id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id          uuid           NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  provider_name     text           NOT NULL,
  provider_logo_url text           NOT NULL,
  type              streaming_type NOT NULL,
  region            char(2)        NOT NULL DEFAULT 'BR',
  link              text,

  CONSTRAINT movie_streaming_movie_provider_type_region UNIQUE (movie_id, provider_name, type, region)
);

-- ─── Gêneros ─────────────────────────────────────────────────────────────────

CREATE TABLE genres (
  tmdb_id  integer PRIMARY KEY,
  name_pt  text    NOT NULL
);

-- ─── Dados de usuário ─────────────────────────────────────────────────────────

CREATE TABLE user_favorites (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid        NOT NULL REFERENCES movies(id)     ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE user_watchlist (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid        NOT NULL REFERENCES movies(id)     ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  watched    boolean     NOT NULL DEFAULT false,

  PRIMARY KEY (user_id, movie_id)
);

-- ─── Operações internas ───────────────────────────────────────────────────────

CREATE TABLE sync_logs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name    text        NOT NULL,
  status           sync_status NOT NULL,
  started_at       timestamptz NOT NULL DEFAULT now(),
  finished_at      timestamptz,
  error_message    text,
  items_processed  integer,

  CONSTRAINT sync_logs_finished_after_started CHECK (
    finished_at IS NULL OR finished_at >= started_at
  )
);

-- Limpeza automática de logs com mais de 30 dias via pg_cron (configurado na migration de cron)
CREATE INDEX sync_logs_started_at_idx ON sync_logs (started_at DESC);

-- Tabela de controle de rate limiting (usada via RPC SECURITY DEFINER)
CREATE TABLE rate_limits (
  key          text        PRIMARY KEY,
  count        integer     NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rate_limits_count_positive CHECK (count >= 0)
);
