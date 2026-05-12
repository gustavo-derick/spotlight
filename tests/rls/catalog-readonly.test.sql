-- Testes de RLS para tabelas de catálogo (movies, people, genres, etc.).
-- Verifica que SELECT é público e que escritas são bloqueadas para anon/authenticated.
-- Execute contra o banco local: psql $DATABASE_URL -f tests/rls/catalog-readonly.test.sql

BEGIN;

-- ─── Setup ────────────────────────────────────────────────────────────────────

-- Insere dados via service_role (sem restrição de RLS)
INSERT INTO movies (id, tmdb_id, imdb_id, title_pt, title_original, genres, last_synced_at)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 99997, 'tt9999997', 'Filme Catálogo RLS', 'Catalog RLS Movie', '{}', now())
ON CONFLICT (tmdb_id) DO NOTHING;

INSERT INTO genres (tmdb_id, name_pt) VALUES (99999, 'Gênero Teste') ON CONFLICT DO NOTHING;

-- ─── Teste 1: anon pode fazer SELECT em movies ────────────────────────────────

DO $$
DECLARE
  v_count integer;
BEGIN
  SET LOCAL ROLE anon;

  SELECT COUNT(*) INTO v_count FROM movies;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'FALHOU Teste 1: anon não conseguiu ler movies (0 linhas)';
  END IF;
  RAISE NOTICE 'PASSOU Teste 1: anon pode SELECT em movies (% linhas)', v_count;
END;
$$;

-- ─── Teste 2: anon não pode INSERT em movies ─────────────────────────────────

DO $$
BEGIN
  SET LOCAL ROLE anon;

  BEGIN
    INSERT INTO movies (tmdb_id, imdb_id, title_pt, title_original, genres, last_synced_at)
    VALUES (88888, 'tt8888888', 'Invasão Anon', 'Anon Invasion', '{}', now());
    RAISE EXCEPTION 'FALHOU Teste 2: anon conseguiu INSERT em movies';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASSOU Teste 2: anon não pode INSERT em movies';
  END;
END;
$$;

-- ─── Teste 3: authenticated não pode INSERT em movies ────────────────────────

DO $$
BEGIN
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000001"}';

  BEGIN
    INSERT INTO movies (tmdb_id, imdb_id, title_pt, title_original, genres, last_synced_at)
    VALUES (77777, 'tt7777777', 'Invasão Auth', 'Auth Invasion', '{}', now());
    RAISE EXCEPTION 'FALHOU Teste 3: authenticated conseguiu INSERT em movies';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASSOU Teste 3: authenticated não pode INSERT em movies';
  END;
END;
$$;

-- ─── Teste 4: authenticated não pode UPDATE em movies ────────────────────────

DO $$
DECLARE
  v_updated integer;
BEGIN
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000001"}';

  BEGIN
    UPDATE movies SET title_pt = 'Hackeado' WHERE tmdb_id = 99997;
    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated > 0 THEN
      RAISE EXCEPTION 'FALHOU Teste 4: authenticated atualizou % linha(s) em movies', v_updated;
    END IF;
    RAISE NOTICE 'PASSOU Teste 4: authenticated não pode UPDATE em movies (0 linhas afetadas)';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASSOU Teste 4: authenticated não pode UPDATE em movies (bloqueado por RLS)';
  END;
END;
$$;

-- ─── Teste 5: anon pode SELECT em genres ─────────────────────────────────────

DO $$
DECLARE
  v_count integer;
BEGIN
  SET LOCAL ROLE anon;

  SELECT COUNT(*) INTO v_count FROM genres;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'FALHOU Teste 5: anon não conseguiu ler genres';
  END IF;
  RAISE NOTICE 'PASSOU Teste 5: anon pode SELECT em genres (% linhas)', v_count;
END;
$$;

-- ─── Teste 6: sync_logs é inacessível para anon e authenticated ──────────────

DO $$
DECLARE
  v_count integer;
BEGIN
  SET LOCAL ROLE anon;

  SELECT COUNT(*) INTO v_count FROM sync_logs;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'FALHOU Teste 6: anon conseguiu ver % linhas de sync_logs', v_count;
  END IF;
  RAISE NOTICE 'PASSOU Teste 6: anon não pode SELECT em sync_logs';
END;
$$;

DO $$
DECLARE
  v_count integer;
BEGIN
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000001"}';

  SELECT COUNT(*) INTO v_count FROM sync_logs;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'FALHOU Teste 7: authenticated conseguiu ver % linhas de sync_logs', v_count;
  END IF;
  RAISE NOTICE 'PASSOU Teste 7: authenticated não pode SELECT em sync_logs';
END;
$$;

ROLLBACK;
