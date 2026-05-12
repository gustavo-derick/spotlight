// Gerado via: npx supabase gen types typescript --project-id <id> > src/types/database.ts
// Não editar manualmente — execute o comando acima após cada migration aplicada em produção.
// Formato compatível com @supabase/supabase-js v2.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      genres: {
        Row: {
          name_pt: string
          tmdb_id: number
        }
        Insert: {
          name_pt: string
          tmdb_id: number
        }
        Update: {
          name_pt?: string
          tmdb_id?: number
        }
        Relationships: []
      }
      movie_cast: {
        Row: {
          character: string | null
          movie_id: string
          order: number
          person_id: string
        }
        Insert: {
          character?: string | null
          movie_id: string
          order?: number
          person_id: string
        }
        Update: {
          character?: string | null
          movie_id?: string
          order?: number
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'movie_cast_movie_id_fkey'
            columns: ['movie_id']
            isOneToOne: false
            referencedRelation: 'movies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'movie_cast_person_id_fkey'
            columns: ['person_id']
            isOneToOne: false
            referencedRelation: 'people'
            referencedColumns: ['id']
          },
        ]
      }
      movie_crew: {
        Row: {
          job: string
          movie_id: string
          person_id: string
        }
        Insert: {
          job: string
          movie_id: string
          person_id: string
        }
        Update: {
          job?: string
          movie_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'movie_crew_movie_id_fkey'
            columns: ['movie_id']
            isOneToOne: false
            referencedRelation: 'movies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'movie_crew_person_id_fkey'
            columns: ['person_id']
            isOneToOne: false
            referencedRelation: 'people'
            referencedColumns: ['id']
          },
        ]
      }
      movie_ratings: {
        Row: {
          fetched_at: string
          id: string
          movie_id: string
          score: number
          score_max: number
          source: Database['public']['Enums']['rating_source']
          url: string | null
          votes: number | null
        }
        Insert: {
          fetched_at?: string
          id?: string
          movie_id: string
          score: number
          score_max: number
          source: Database['public']['Enums']['rating_source']
          url?: string | null
          votes?: number | null
        }
        Update: {
          fetched_at?: string
          id?: string
          movie_id?: string
          score?: number
          score_max?: number
          source?: Database['public']['Enums']['rating_source']
          url?: string | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'movie_ratings_movie_id_fkey'
            columns: ['movie_id']
            isOneToOne: false
            referencedRelation: 'movies'
            referencedColumns: ['id']
          },
        ]
      }
      movie_streaming: {
        Row: {
          id: string
          link: string | null
          movie_id: string
          provider_logo_url: string
          provider_name: string
          region: string
          type: Database['public']['Enums']['streaming_type']
        }
        Insert: {
          id?: string
          link?: string | null
          movie_id: string
          provider_logo_url: string
          provider_name: string
          region?: string
          type: Database['public']['Enums']['streaming_type']
        }
        Update: {
          id?: string
          link?: string | null
          movie_id?: string
          provider_logo_url?: string
          provider_name?: string
          region?: string
          type?: Database['public']['Enums']['streaming_type']
        }
        Relationships: [
          {
            foreignKeyName: 'movie_streaming_movie_id_fkey'
            columns: ['movie_id']
            isOneToOne: false
            referencedRelation: 'movies'
            referencedColumns: ['id']
          },
        ]
      }
      movies: {
        Row: {
          backdrop_url: string | null
          genres: number[]
          id: string
          imdb_id: string
          last_synced_at: string
          original_language: string
          overview_pt: string | null
          poster_url: string | null
          release_date: string | null
          runtime: number | null
          title_original: string
          title_pt: string
          tmdb_id: number
        }
        Insert: {
          backdrop_url?: string | null
          genres?: number[]
          id?: string
          imdb_id: string
          last_synced_at?: string
          original_language?: string
          overview_pt?: string | null
          poster_url?: string | null
          release_date?: string | null
          runtime?: number | null
          title_original: string
          title_pt: string
          tmdb_id: number
        }
        Update: {
          backdrop_url?: string | null
          genres?: number[]
          id?: string
          imdb_id?: string
          last_synced_at?: string
          original_language?: string
          overview_pt?: string | null
          poster_url?: string | null
          release_date?: string | null
          runtime?: number | null
          title_original?: string
          title_pt?: string
          tmdb_id?: number
        }
        Relationships: []
      }
      people: {
        Row: {
          id: string
          known_for: string | null
          name: string
          profile_url: string | null
          tmdb_id: number
        }
        Insert: {
          id?: string
          known_for?: string | null
          name: string
          profile_url?: string | null
          tmdb_id: number
        }
        Update: {
          id?: string
          known_for?: string | null
          name?: string
          profile_url?: string | null
          tmdb_id?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          function_name: string
          id: string
          items_processed: number | null
          started_at: string
          status: Database['public']['Enums']['sync_status']
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          function_name: string
          id?: string
          items_processed?: number | null
          started_at?: string
          status: Database['public']['Enums']['sync_status']
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          function_name?: string
          id?: string
          items_processed?: number | null
          started_at?: string
          status?: Database['public']['Enums']['sync_status']
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          movie_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          movie_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          movie_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_favorites_movie_id_fkey'
            columns: ['movie_id']
            isOneToOne: false
            referencedRelation: 'movies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_favorites_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_watchlist: {
        Row: {
          created_at: string
          movie_id: string
          user_id: string
          watched: boolean
        }
        Insert: {
          created_at?: string
          movie_id: string
          user_id: string
          watched?: boolean
        }
        Update: {
          created_at?: string
          movie_id?: string
          user_id?: string
          watched?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'user_watchlist_movie_id_fkey'
            columns: ['movie_id']
            isOneToOne: false
            referencedRelation: 'movies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_watchlist_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      cleanup_rate_limits: {
        Args: Record<string, never>
        Returns: undefined
      }
      cleanup_sync_logs: {
        Args: Record<string, never>
        Returns: undefined
      }
      search_movies: {
        Args: {
          p_query: string
          p_genre_ids?: number[]
          p_limit?: number
          p_offset?: number
        }
        Returns: Database['public']['Tables']['movies']['Row'][]
      }
    }
    Enums: {
      rating_source: 'imdb' | 'rotten_tomatoes' | 'letterboxd'
      streaming_type: 'flatrate' | 'rent' | 'buy' | 'ads'
      sync_status: 'started' | 'success' | 'error'
    }
    CompositeTypes: Record<string, never>
  }
}

// ─── Helpers (padrão Supabase) ────────────────────────────────────────────────

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']

export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']

export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]

// Aliases úteis
export type Movie = Tables<'movies'>
export type MovieInsert = TablesInsert<'movies'>
export type Person = Tables<'people'>
export type PersonInsert = TablesInsert<'people'>
export type MovieRating = Tables<'movie_ratings'>
export type MovieRatingInsert = TablesInsert<'movie_ratings'>
export type MovieStreaming = Tables<'movie_streaming'>
export type MovieStreamingInsert = TablesInsert<'movie_streaming'>
export type Genre = Tables<'genres'>
export type UserFavorite = Tables<'user_favorites'>
export type UserWatchlistItem = Tables<'user_watchlist'>
export type SyncLog = Tables<'sync_logs'>
export type RatingSource = Enums<'rating_source'>
export type StreamingType = Enums<'streaming_type'>
