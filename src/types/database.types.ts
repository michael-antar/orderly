export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '12.2.12 (cd3cf9e)';
    };
    public: {
        Tables: {
            category_definitions: {
                Row: {
                    created_at: string | null;
                    field_definitions: Json;
                    icon: string | null;
                    id: string;
                    name: string;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    field_definitions?: Json;
                    icon?: string | null;
                    id?: string;
                    name: string;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    field_definitions?: Json;
                    icon?: string | null;
                    id?: string;
                    name?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            comparisons: {
                Row: {
                    created_at: string;
                    id: string;
                    loser_id: string;
                    loser_rating_after: number;
                    loser_rating_before: number;
                    user_id: string;
                    winner_id: string;
                    winner_rating_after: number;
                    winner_rating_before: number;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    loser_id: string;
                    loser_rating_after: number;
                    loser_rating_before: number;
                    user_id: string;
                    winner_id: string;
                    winner_rating_after: number;
                    winner_rating_before: number;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    loser_id?: string;
                    loser_rating_after?: number;
                    loser_rating_before?: number;
                    user_id?: string;
                    winner_id?: string;
                    winner_rating_after?: number;
                    winner_rating_before?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'comparisons_loser_id_fkey';
                        columns: ['loser_id'];
                        isOneToOne: false;
                        referencedRelation: 'items';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'comparisons_winner_id_fkey';
                        columns: ['winner_id'];
                        isOneToOne: false;
                        referencedRelation: 'items';
                        referencedColumns: ['id'];
                    },
                ];
            };
            item_tags: {
                Row: {
                    item_id: string;
                    tag_id: number;
                };
                Insert: {
                    item_id: string;
                    tag_id: number;
                };
                Update: {
                    item_id?: string;
                    tag_id?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'item_tags_item_id_fkey';
                        columns: ['item_id'];
                        isOneToOne: false;
                        referencedRelation: 'items';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'item_tags_tag_id_fkey';
                        columns: ['tag_id'];
                        isOneToOne: false;
                        referencedRelation: 'tags';
                        referencedColumns: ['id'];
                    },
                ];
            };
            items: {
                Row: {
                    category_def_id: string | null;
                    comparison_count: number;
                    created_at: string;
                    description: string | null;
                    id: string;
                    name: string;
                    properties: Json | null;
                    rating: number | null;
                    status: Database['public']['Enums']['item_status'];
                    user_id: string;
                };
                Insert: {
                    category_def_id?: string | null;
                    comparison_count?: number;
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    name: string;
                    properties?: Json | null;
                    rating?: number | null;
                    status?: Database['public']['Enums']['item_status'];
                    user_id: string;
                };
                Update: {
                    category_def_id?: string | null;
                    comparison_count?: number;
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    name?: string;
                    properties?: Json | null;
                    rating?: number | null;
                    status?: Database['public']['Enums']['item_status'];
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'items_category_def_id_fkey';
                        columns: ['category_def_id'];
                        isOneToOne: false;
                        referencedRelation: 'category_definitions';
                        referencedColumns: ['id'];
                    },
                ];
            };
            tags: {
                Row: {
                    category_def_id: string;
                    id: number;
                    name: string;
                    user_id: string;
                };
                Insert: {
                    category_def_id: string;
                    id?: never;
                    name: string;
                    user_id: string;
                };
                Update: {
                    category_def_id?: string;
                    id?: never;
                    name?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'tags_category_def_id_fkey';
                        columns: ['category_def_id'];
                        isOneToOne: false;
                        referencedRelation: 'category_definitions';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            get_tags_with_usage: {
                Args: {
                    p_category: Database['public']['Enums']['item_category'];
                };
                Returns: {
                    category: Database['public']['Enums']['item_category'];
                    id: number;
                    is_used: boolean;
                    name: string;
                    user_id: string;
                }[];
            };
            get_user_id_from_item: {
                Args: { item_id: string };
                Returns: string;
            };
            handle_comparison: {
                Args: { p_loser_id: string; p_winner_id: string };
                Returns: undefined;
            };
        };
        Enums: {
            item_category: 'restaurant' | 'movie' | 'book' | 'show' | 'album';
            item_status: 'ranked' | 'backlog';
            price_range: '$' | '$$' | '$$$' | '$$$$';
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
    keyof Database,
    'public'
>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    public: {
        Enums: {
            item_category: ['restaurant', 'movie', 'book', 'show', 'album'],
            item_status: ['ranked', 'backlog'],
            price_range: ['$', '$$', '$$$', '$$$$'],
        },
    },
} as const;
