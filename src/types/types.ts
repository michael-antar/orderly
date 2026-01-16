import { type PostgrestError } from '@supabase/supabase-js';

// Core status and sorting
export type Status = 'ranked' | 'backlog';
export type SortOption = 'rating' | 'name' | 'created_at';

// --- Dynamic Schema Types ---
export type FieldType = 'string' | 'number' | 'boolean' | 'select' | 'location';

export type FieldDefinition = {
    key: string; // Immutable unique id, JSON key for item.properties
    type: FieldType;
    label: string; // Human readable, mutable
    options?: string[]; // For 'select' type
    required?: boolean;
};

export type CategoryDefintion = {
    id: string;
    user_id: string | null; // null = global default category

    name: string;
    icon: string; // Lucide icon name
    field_definitions: FieldDefinition[];
};

// --- Database Item Types ---
export type Tag = {
    id: number;
    user_id: string;
    category_def_id: string; // FK to 'category_definitions.id'

    name: string;
};

export type Item = {
    id: string;
    user_id: string;
    category_def_id: string; // FK to 'category_definitions.id'

    name: string;
    status: Status;
    rating: number | null; // null = Status.backlog
    description: string | null;
    comparison_count: number;
    created_at: string;

    tags: Tag[] | null;
    properties: Record<string, any>; // Store key-value pairs like: { address: "...", distance: 5 }
};

// --- Filter types ---
export type FilterOperator =
    | 'is'
    | 'is_not'
    | 'contains'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte';

export type FilterRule = {
    id: string;
    field_id: string;

    operator: FilterOperator | '';
    value: string | number;
};

export type AppliedFilters = {
    tags: Tag[];
    rules: FilterRule[];
};

// For when updating an item
export type ItemFormData = {
    name: string;
    description: string;
    status: Status;
    rating: number | null;

    tags: Tag[];
    properties: Record<string, any>;
};

// Generic type for the response from Supabase mutation operations
export type SupabaseMutationResponse = Promise<{
    error: PostgrestError | null;
}>;
