-- Habilita extensões necessárias.
-- pg_trgm: busca textual por trigram (similarity search)
-- pgcrypto: gen_random_uuid() e funções criptográficas
-- uuid-ossp: uuid_generate_v4() como alternativa

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
