import type { LucideIcon } from 'lucide-react';
import { Utensils, Film, Tv, Book, Music } from 'lucide-react';
import { type PostgrestError } from '@supabase/supabase-js';

// --- Core Category and Status Types ---
export type Category = 'album' | 'book' | 'movie' | 'restaurant' | 'show';
export type Status = 'ranked' | 'backlog';
export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

// --- Database and API Types ---

// Base item stored in 'items' table
export type Item = {
    id: string;
    created_at: string;
    user_id: string;
    name: string;
    category: Category;
    status: Status;
    rating: number | null;
    description: string | null;
    comparison_count: number;
};

// Generic type for the response from Supabase mutation operations
export type SupabaseMutationResponse = Promise<{
    error: PostgrestError | null;
}>;

// - Category Specific Details -

export type DetailTableNames =
    | 'album_details'
    | 'book_details'
    | 'movie_details'
    | 'restaurant_details'
    | 'show_details';

export type AlbumDetails = {
    artist: string | null;
    release_year: number | null;
};
export type BookDetails = {
    author: string | null;
    release_year: number | null;
    series_name: string | null;
    series_order: number | null;
};
export type MovieDetails = {
    director: string | null;
    release_year: number | null;
};
export type RestaurantDetails = {
    address: string | null;
    price_range: PriceRange | null;
    latitude: number | null;
    longitude: number | null;
};
export type ShowDetails = {
    start_year: number | null;
    end_year: number | null;
};

// A union of all possible category-specific detail types
export type AnyDetails =
    | AlbumDetails
    | BookDetails
    | MovieDetails
    | RestaurantDetails
    | ShowDetails;

// Maps category name to its specific details type
export type DetailsMap = {
    album: AlbumDetails;
    book: BookDetails;
    movie: MovieDetails;
    restaurant: RestaurantDetails;
    show: ShowDetails;
};

// Maps over the Category type to create the `...details` properties
export type CombinedItem = Item & {
    [K in Category as `${K}_details`]: K extends 'album'
        ? AlbumDetails | null
        : K extends 'book'
          ? BookDetails | null
          : K extends 'movie'
            ? MovieDetails | null
            : K extends 'restaurant'
              ? RestaurantDetails | null
              : K extends 'show'
                ? ShowDetails | null
                : never;
};

// --- Form and Components Prop Types ---

export type ItemFormData = Partial<
    {
        name: string;
        description: string;
        status: Status;
        rating: number | null;
    } & AlbumDetails &
        BookDetails &
        MovieDetails &
        RestaurantDetails &
        ShowDetails
>;

export type CategoryFieldsProps = {
    formData: ItemFormData;
    onFieldChange: <K extends keyof ItemFormData>(
        field: K,
        value: ItemFormData[K],
    ) => void;
};

// --- UI and Navigation Constants ---

type NavItem = {
    name: Category;
    icon: LucideIcon;
    label: string;
};

export const navItems: readonly NavItem[] = [
    { name: 'restaurant', icon: Utensils, label: 'Restaurants' },
    { name: 'movie', icon: Film, label: 'Movies' },
    { name: 'show', icon: Tv, label: 'TV Shows' },
    { name: 'book', icon: Book, label: 'Books' },
    { name: 'album', icon: Music, label: 'Albums' },
] as const;

export const categoryTitles = navItems.reduce(
    (acc, item) => {
        acc[item.name] = item.label;
        return acc;
    },
    {} as Record<Category, string>,
);
