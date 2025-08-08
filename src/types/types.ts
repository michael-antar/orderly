import type { LucideIcon } from 'lucide-react';
import { Utensils, Film, Tv, Book, Music } from 'lucide-react';

export type Category = 'album'| 'book' | 'movie' | 'restaurant' | 'show';
export type DetailTableNames = "album_details" | "book_details" | "movie_details" | "restaurant_details" | "show_details";
export type Status = 'ranked' | 'backlog';

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

export type CombinedItem = Item & {
    album_details: AlbumDetails | null;
    book_details: BookDetails | null;
    movie_details: MovieDetails | null;
    restaurant_details: RestaurantDetails | null;
    show_details: ShowDetails | null;
}

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
export type PriceRange = '$' | '$$' | '$$$' | '$$$$';
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

export const categoryTitles = navItems.reduce((acc, item) => {
    acc[item.name] = item.label;
    return acc;
}, {} as Record<Category, string>);