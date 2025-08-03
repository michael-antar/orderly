export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      album_details: {
        Row: {
          artist: string | null
          item_id: string
          release_year: number | null
        }
        Insert: {
          artist?: string | null
          item_id: string
          release_year?: number | null
        }
        Update: {
          artist?: string | null
          item_id?: string
          release_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "album_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      book_details: {
        Row: {
          author: string | null
          item_id: string
          release_year: number | null
          series_name: string | null
          series_order: number | null
        }
        Insert: {
          author?: string | null
          item_id: string
          release_year?: number | null
          series_name?: string | null
          series_order?: number | null
        }
        Update: {
          author?: string | null
          item_id?: string
          release_year?: number | null
          series_name?: string | null
          series_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons: {
        Row: {
          created_at: string
          id: string
          loser_id: string
          loser_rating_after: number
          loser_rating_before: number
          user_id: string
          winner_id: string
          winner_rating_after: number
          winner_rating_before: number
        }
        Insert: {
          created_at?: string
          id?: string
          loser_id: string
          loser_rating_after: number
          loser_rating_before: number
          user_id: string
          winner_id: string
          winner_rating_after: number
          winner_rating_before: number
        }
        Update: {
          created_at?: string
          id?: string
          loser_id?: string
          loser_rating_after?: number
          loser_rating_before?: number
          user_id?: string
          winner_id?: string
          winner_rating_after?: number
          winner_rating_before?: number
        }
        Relationships: [
          {
            foreignKeyName: "comparisons_loser_id_fkey"
            columns: ["loser_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparisons_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_tags: {
        Row: {
          item_id: string
          tag_id: number
        }
        Insert: {
          item_id: string
          tag_id: number
        }
        Update: {
          item_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_tags_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          comparison_count: number
          created_at: string
          description: string | null
          id: string
          name: string
          rating: number | null
          status: Database["public"]["Enums"]["item_status"]
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          comparison_count?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          rating?: number | null
          status?: Database["public"]["Enums"]["item_status"]
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          comparison_count?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["item_status"]
          user_id?: string
        }
        Relationships: []
      }
      movie_details: {
        Row: {
          director: string | null
          item_id: string
          release_year: number | null
        }
        Insert: {
          director?: string | null
          item_id: string
          release_year?: number | null
        }
        Update: {
          director?: string | null
          item_id?: string
          release_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movie_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_details: {
        Row: {
          address: string | null
          item_id: string
          latitude: number | null
          longitude: number | null
          price_range: Database["public"]["Enums"]["price_range"] | null
        }
        Insert: {
          address?: string | null
          item_id: string
          latitude?: number | null
          longitude?: number | null
          price_range?: Database["public"]["Enums"]["price_range"] | null
        }
        Update: {
          address?: string | null
          item_id?: string
          latitude?: number | null
          longitude?: number | null
          price_range?: Database["public"]["Enums"]["price_range"] | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      show_details: {
        Row: {
          end_year: number | null
          item_id: string
          start_year: number | null
        }
        Insert: {
          end_year?: number | null
          item_id: string
          start_year?: number | null
        }
        Update: {
          end_year?: number | null
          item_id?: string
          start_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "show_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          id: number
          name: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          id?: never
          name: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          id?: never
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_id_from_item: {
        Args: { item_id: string }
        Returns: string
      }
      handle_comparison: {
        Args: { p_winner_id: string; p_loser_id: string }
        Returns: undefined
      }
    }
    Enums: {
      item_category: "restaurant" | "movie" | "book" | "show" | "album"
      item_status: "ranked" | "backlog"
      price_range: "$" | "$$" | "$$$" | "$$$$"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      item_category: ["restaurant", "movie", "book", "show", "album"],
      item_status: ["ranked", "backlog"],
      price_range: ["$", "$$", "$$$", "$$$$"],
    },
  },
} as const
