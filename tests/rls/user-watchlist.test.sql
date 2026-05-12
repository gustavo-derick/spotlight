-- Testes de RLS para user_watchlist.
-- Execute contra o banco local: psql $DATABASE_URL -f tests/rls/user-watchlist.test.sql

BEGIN;

-- ─── Setup ────────────────────────────────────────────────────────────────────

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'user1@test.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'user2@test.com', 'x', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO movies (id, tmdb_id, imdb_id, title_pt, title_original, genres, last_synced_at)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 99998, 'tt9999998', 'Filme Watchlist RLS', 'Watchlist RLS Movie', '{}', now())
ON CONFLICT (tmdb_id) DO NOTHING;

INSERT INTO user_watchlist (user_id, movie_id, watched)
VALUES ('00000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', false)
ON CONFLICT DO NOTHING;

-- ─── Teste 1: user2 não vê watchlist de user1 ────────────────────────────────

DO $$
DECLARE
  v_count integer;
BEGIN
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002"}';

  SELECT COUNT(*) INTO v_count
  FROM user_watchlist
  WHERE user_id = '00000000-0000-0000-0000-000000000001';

  IF v_count > 0 THEN
    RAISE EXCEPTION 'FALHOU Teste 1: user2 viu % itens da watchlist de user1', v_count;
  END IF;
  RAISE NOTICE 'PASSOU Teste 1: user2 não vê watchlist de user1';
END;
$$;

-- ─── Teste 2: user2 não pode inserir na watchlist de user1 ───────────────────

DO $$
BEGIN
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002"}';

  BEGIN
    INSERT INTO user_watchlist (user_id, movie_id)
    VALUES ('00000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    RAISE EXCEPTION 'FALHOU Teste 2: user2 inseriu na watchlist de user1';
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      RAISE NOTICE 'PASSOU Teste 2: user2 não pode inserir na watchlist de user1';
  END;
END;
$$;

-- ─── Teste 3: user2 não pode marcar como assistido item de user1 ─────────────

DO $$
DECLARE
  v_updated integer;
BEGIN
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002"}';

  UPDATE user_watchlist
  SET watched = true
  WHERE user_id = '00000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    RAISE EXCEPTION 'FALHOU Teste 3: user2 atualizou % item(ns) da watchlist de user1', v_updated;
  END IF;
  RAISE NOTICE 'PASSOU Teste 3: user2 não pode atualizar watchlist de user1';
END;
$$;

-- ─── Teste 4: user2 não pode deletar da watchlist de user1 ───────────────────

DO $$
DECLARE
  v_deleted integer;
BEGIN
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002"}';

  DELETE FROM user_watchlist
  WHERE user_id = '00000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted > 0 THEN
    RAISE EXCEPTION 'FALHOU Teste 4: user2 deletou % item(ns) da watchlist de user1', v_deleted;
  END IF;
  RAISE NOTICE 'PASSOU Teste 4: user2 não pode deletar da watchlist de user1';
END;
$$;

-- ─── Teste 5: anon não vê nenhuma watchlist ───────────────────────────────────

DO $$
DECLARE
  v_count integer;
BEGIN
  SET LOCAL ROLE anon;

  SELECT COUNT(*) INTO v_count FROM user_watchlist;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'FALHOU Teste 5: anon viu % itens de watchlist', v_count;
  END IF;
  RAISE NOTICE 'PASSOU Teste 5: anon não vê nenhuma watchlist';
END;
$$;

ROLLBACK;
