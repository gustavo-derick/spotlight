// Gerado via: npx supabase gen types typescript --local > src/types/database.ts
// Não editar manualmente — rodar o comando acima após cada migration

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      movies: {
        Row: {
          id: string
          tmdb_id: number
          imdb_id: string
          title_pt: string
          title_original: string
          original_language: string
          overview_pt: string | null
          release_date: string | null
          runtime: number | null
          poster_url: string | null
          backdrop_url: string | null
          genres: number[]
          last_synced_at: string
        }
        Insert: Omit<Database['public']['Tables']['movies']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['movies']['Insert']>
      }
      people: {
        Row: {
          id: string
          tmdb_id: number
          name: string
          profile_url: string | null
          known_for: string | null
        }
        Insert: Omit<Database['public']['Tables']['people']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['people']['Insert']>
      }
      movie_cast: {
        Row: {
          movie_id: string
          person_id: string
          character: string | null
          order: number
        }
        Insert: Database['public']['Tables']['movie_cast']['Row']
        Update: Partial<Database['public']['Tables']['movie_cast']['Insert']>
      }
      movie_crew: {
        Row: {
          movie_id: string
          person_id: string
          job: string
        }
        Insert: Database['public']['Tables']['movie_crew']['Row']
        Update: Partial<Database['public']['Tables']['movie_crew']['Insert']>
      }
      movie_ratings: {
        Row: {
          id: string
          movie_id: string
          source: 'imdb' | 'rotten_tomatoes' | 'letterboxd'
          score: number
          score_max: number
          votes: number | null
          url: string | null
          fetched_at: string
        }
        Insert: Omit<Database['public']['Tables']['movie_ratings']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['movie_ratings']['Insert']>
      }
      movie_streaming: {
        Row: {
          id: string
          movie_id: string
          provider_name: string
          provider_logo_url: string
          type: 'flatrate' | 'rent' | 'buy' | 'ads'
          region: string
          link: string | null
        }
        Insert: Omit<Database['public']['Tables']['movie_streaming']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['movie_streaming']['Insert']>
      }
      genres: {
        Row: {
          tmdb_id: number
          name_pt: string
        }
        Insert: Database['public']['Tables']['genres']['Row']
        Update: Partial<Database['public']['Tables']['genres']['Insert']>
      }
      user_favorites: {
        Row: {
          user_id: string
          movie_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_favorites']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['user_favorites']['Insert']>
      }
      user_watchlist: {
        Row: {
          user_id: string
          movie_id: string
          created_at: string
          watched: boolean
        }
        Insert: Omit<Database['public']['Tables']['user_watchlist']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['user_watchlist']['Insert']>
      }
      sync_logs: {
        Row: {
          id: string
          function_name: string
          status: 'started' | 'success' | 'error'
          started_at: string
          finished_at: string | null
          error_message: string | null
          items_processed: number | null
        }
        Insert: Omit<Database['public']['Tables']['sync_logs']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['sync_logs']['Insert']>
      }
      rate_limits: {
        Row: {
          key: string
          count: number
          window_start: string
        }
        Insert: Database['public']['Tables']['rate_limits']['Row']
        Update: Partial<Database['public']['Tables']['rate_limits']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      search_movies: {
        Args: { query: string; genre_ids?: number[]; limit_n?: number; offset_n?: number }
        Returns: Database['public']['Tables']['movies']['Row'][]
      }
      check_rate_limit: {
        Args: { p_key: string; p_max_requests: number; p_window_seconds: number }
        Returns: boolean
      }
    }
    Enums: {
      rating_source: 'imdb' | 'rotten_tomatoes' | 'letterboxd'
      streaming_type: 'flatrate' | 'rent' | 'buy' | 'ads'
      sync_status: 'started' | 'success' | 'error'
    }
  }
}
