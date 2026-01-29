import { type PostgrestError } from '@supabase/supabase-js';

// Core status
export type Status = 'ranked' | 'backlog';

// --- Dynamic Schema Types ---
export type FieldType = 'string' | 'number' | 'boolean' | 'select' | 'location';

export type FieldDefinition = {
    key: string; // Immutable JSON key for item.properties. Unique ONLY to CategoryDef.properties
    type: FieldType;
    label: string; // Human readable, mutable
    options?: string[]; // For FieldType.select
    required?: boolean;
};

export type CategoryDefinition = {
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

// TODO: Implement feature later
export type LocationValue = {
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    } | null;
};

// A union of ALL allowed values in the 'properties' column
export type ItemPropertyValue =
    | string
    | number
    | boolean
    | LocationValue
    | null;

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
    properties: Record<string, ItemPropertyValue>; // Store key-value pairs like: { address: "...", distance: 5 }
};

// --- Sorting and Filter types ---
export type SortOption = 'rating' | 'name' | 'created_at';

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
    field_key: string;

    operator: FilterOperator | '';
    value: ItemPropertyValue;
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
    properties: Record<string, ItemPropertyValue>;
};

// Generic type for the response from Supabase mutation operations
export type SupabaseMutationResponse = Promise<{
    error: PostgrestError | null;
}>;
