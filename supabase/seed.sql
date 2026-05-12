-- Seed para desenvolvimento local.
-- Rode com: supabase db reset (aplica migrations + seed)

-- ─── Gêneros TMDB (lista oficial, com nomes em PT-BR) ────────────────────────

INSERT INTO genres (tmdb_id, name_pt) VALUES
  (28,    'Ação'),
  (12,    'Aventura'),
  (16,    'Animação'),
  (35,    'Comédia'),
  (80,    'Crime'),
  (99,    'Documentário'),
  (18,    'Drama'),
  (10751, 'Família'),
  (14,    'Fantasia'),
  (36,    'História'),
  (27,    'Terror'),
  (10402, 'Música'),
  (9648,  'Mistério'),
  (10749, 'Romance'),
  (878,   'Ficção Científica'),
  (10770, 'Cinema TV'),
  (53,    'Thriller'),
  (10752, 'Guerra'),
  (37,    'Faroeste')
ON CONFLICT (tmdb_id) DO UPDATE SET name_pt = EXCLUDED.name_pt;

-- ─── Filmes de exemplo (para testes locais) ───────────────────────────────────

INSERT INTO movies (
  tmdb_id, imdb_id, title_pt, title_original, original_language,
  overview_pt, release_date, runtime, poster_url, backdrop_url, genres
) VALUES
(
  550,
  'tt0137523',
  'Clube da Luta',
  'Fight Club',
  'en',
  'Um escriturário insatisfeito com sua vida monótona conhece um vendedor de sabão carismático e juntos formam um clube de luta clandestino.',
  '1999-10-15',
  139,
  'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  'https://image.tmdb.org/t/p/original/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg',
  ARRAY[18, 53]
),
(
  27205,
  'tt1375666',
  'A Origem',
  'Inception',
  'en',
  'Um ladrão especializado em roubar segredos do subconsciente das pessoas durante o sono recebe a missão inversa: plantar uma ideia na mente de um executivo.',
  '2010-07-16',
  148,
  'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
  'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
  ARRAY[28, 878, 12]
),
(
  157336,
  'tt0816692',
  'Interestelar',
  'Interstellar',
  'en',
  'Um grupo de astronautas viaja por um buraco de minhoca em busca de um novo lar para a humanidade enquanto a Terra se torna inabitável.',
  '2014-11-05',
  169,
  'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
  ARRAY[12, 18, 878]
)
ON CONFLICT (tmdb_id) DO NOTHING;

-- ─── Ratings de exemplo ───────────────────────────────────────────────────────

INSERT INTO movie_ratings (movie_id, source, score, score_max, votes, url)
SELECT m.id, 'imdb'::rating_source, 8.8, 10.0, 2100000, 'https://www.imdb.com/title/tt0137523/'
FROM movies m WHERE m.imdb_id = 'tt0137523'
ON CONFLICT (movie_id, source) DO NOTHING;

INSERT INTO movie_ratings (movie_id, source, score, score_max, votes, url)
SELECT m.id, 'imdb'::rating_source, 8.8, 10.0, 2500000, 'https://www.imdb.com/title/tt1375666/'
FROM movies m WHERE m.imdb_id = 'tt1375666'
ON CONFLICT (movie_id, source) DO NOTHING;

INSERT INTO movie_ratings (movie_id, source, score, score_max, votes, url)
SELECT m.id, 'imdb'::rating_source, 8.7, 10.0, 2000000, 'https://www.imdb.com/title/tt0816692/'
FROM movies m WHERE m.imdb_id = 'tt0816692'
ON CONFLICT (movie_id, source) DO NOTHING;

-- ─── Streamings de exemplo ────────────────────────────────────────────────────

INSERT INTO movie_streaming (movie_id, provider_name, provider_logo_url, type, region, link)
SELECT
  m.id,
  'Netflix',
  'https://image.tmdb.org/t/p/original/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg',
  'flatrate'::streaming_type,
  'BR',
  NULL
FROM movies m WHERE m.imdb_id = 'tt1375666'
ON CONFLICT (movie_id, provider_name, type, region) DO NOTHING;
