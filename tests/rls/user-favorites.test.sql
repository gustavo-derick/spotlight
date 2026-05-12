-- Testes de RLS para user_favorites.
-- Cada bloco DO verifica uma policy e lança EXCEPTION se a proteção falhar.
-- Execute contra o banco local: psql $DATABASE_URL -f tests/rls/user-favorites.test.sql

BEGIN;

-- ─── Setup ────────────────────────────────────────────────────────────────────

-- Cria dois usuários de teste diretamente no schema auth
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'user1@test.com', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'user2@test.com', 'x', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Filme de teste
INSERT INTO movies (id, tmdb_id, imdb_id, title_pt, title_original, genres, last_synced_at)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 99999, 'tt9999999', 'Filme Teste RLS', 'RLS Test Movie', '{}', now())
ON CONFLICT (tmdb_id) DO NOTHING;

-- Favorito do user1
INSERT INTO user_favorites (user_id, movie_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT DO NOTHING;

-- ─── Teste 1: usuário autenticado só vê os próprios favoritos ─────────────────

DO $$
DECLARE
  v_count integer;
BEGIN
  -- Simula user2 autenticado
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002"}';

  SELECT COUNT(*) INTO v_count
  FROM user_favorites
  WHERE user_id = '00000000-0000-0000-0000-000000000001';

  IF v_count > 0 THEN
    RAISE EXCEPTION 'FALHOU Teste 1: user2 conseguiu ver favoritos de user1 (contagem: %)', v_count;
  END IF;
  RAISE NOTICE 'PASSOU Teste 1: user2 não vê favoritos de user1';
END;
$$;

-- ─── Teste 2: usuário autenticado não pode inserir favorito de outro usuário ──

DO $$
BEGIN
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002"}';

  BEGIN
    INSERT INTO user_favorites (user_id, movie_id)
    VALUES ('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    RAISE EXCEPTION 'FALHOU Teste 2: user2 conseguiu inserir favorito com user_id de user1';
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      RAISE NOTICE 'PASSOU Teste 2: user2 não pode inserir favorito de outro usuário';
  END;
END;
$$;

-- ─── Teste 3: usuário anônimo não pode ver favoritos ─────────────────────────

DO $$
DECLARE
  v_count integer;
BEGIN
  SET LOCAL ROLE anon;

  SELECT COUNT(*) INTO v_count FROM user_favorites;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'FALHOU Teste 3: anon conseguiu ver % favoritos', v_count;
  END IF;
  RAISE NOTICE 'PASSOU Teste 3: anon não vê nenhum favorito';
END;
$$;

-- ─── Teste 4: usuário anônimo não pode inserir favoritos ─────────────────────

DO $$
BEGIN
  SET LOCAL ROLE anon;

  BEGIN
    INSERT INTO user_favorites (user_id, movie_id)
    VALUES ('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    RAISE EXCEPTION 'FALHOU Teste 4: anon conseguiu inserir favorito';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASSOU Teste 4: anon não pode inserir favorito';
  END;
END;
$$;

-- ─── Teste 5: usuário autenticado não pode deletar favorito de outro ─────────

DO $$
DECLARE
  v_deleted integer;
BEGIN
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002"}';

  DELETE FROM user_favorites
  WHERE user_id = '00000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted > 0 THEN
    RAISE EXCEPTION 'FALHOU Teste 5: user2 deletou % favorito(s) de user1', v_deleted;
  END IF;
  RAISE NOTICE 'PASSOU Teste 5: user2 não pode deletar favorito de user1';
END;
$$;

-- ─── Cleanup ─────────────────────────────────────────────────────────────────

ROLLBACK;
