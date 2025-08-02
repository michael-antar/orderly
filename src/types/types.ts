import type { LucideIcon } from 'lucide-react';
import { Utensils, Film, Tv, Book, Music } from 'lucide-react';

export type Category = 'restaurant' | 'movie' | 'show' | 'book' | 'album';
export type Status = 'ranked' | 'backlog';

export type Item = {
    user_id: string;
    name: string;
    category: Category;
    status: Status;
    rating?: number;
    description: string | null;
}

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