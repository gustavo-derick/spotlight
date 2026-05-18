CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE collection_movies (
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  
  PRIMARY KEY (collection_id, movie_id)
);

CREATE TABLE collection_collaborators (
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  PRIMARY KEY (collection_id, user_id)
);

-- Habilitar RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_collaborators ENABLE ROW LEVEL SECURITY;

-- Políticas para collections
CREATE POLICY "Coleções públicas e próprias são visíveis" 
  ON collections FOR SELECT 
  USING (
    is_public = true 
    OR auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM collection_collaborators cc 
      WHERE cc.collection_id = collections.id AND cc.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir suas próprias coleções" 
  ON collections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias coleções" 
  ON collections FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias coleções" 
  ON collections FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para collection_movies
CREATE POLICY "Filmes de coleções públicas e próprias são visíveis" 
  ON collection_movies FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM collections c 
      WHERE c.id = collection_movies.collection_id 
      AND (
        c.is_public = true 
        OR c.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM collection_collaborators cc 
          WHERE cc.collection_id = c.id AND cc.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Gerenciar filmes na coleção" 
  ON collection_movies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM collections c 
      WHERE c.id = collection_movies.collection_id 
      AND (
        c.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM collection_collaborators cc 
          WHERE cc.collection_id = c.id AND cc.user_id = auth.uid()
        )
      )
    )
  );

-- Políticas para collection_collaborators
CREATE POLICY "Colaboradores visíveis para quem participa da coleção" 
  ON collection_collaborators FOR SELECT 
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collections c 
      WHERE c.id = collection_collaborators.collection_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Gerenciar colaboradores" 
  ON collection_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM collections c 
      WHERE c.id = collection_collaborators.collection_id AND c.user_id = auth.uid()
    )
  );
