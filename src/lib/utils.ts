import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type CombinedItem } from "@/types/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCategoryDetails = (item: CombinedItem): [string, string][] => {
    const details: [string, string][] = [];
    switch (item.category) {
        case 'movie':
            if (item.movie_details?.director) details.push(['Director', item.movie_details.director]);
            if (item.movie_details?.release_year) details.push(['Year', String(item.movie_details.release_year)]);
            break;
        case 'album':
            if (item.album_details?.artist) details.push(['Artist', item.album_details.artist]);
            if (item.album_details?.release_year) details.push(['Year', String(item.album_details.release_year)]);
            break;
        case 'book':
            if (item.book_details?.author) details.push(['Author', item.book_details.author]);
            if (item.book_details?.series_name) details.push(['Series', item.book_details.series_name]);
            break;
        case 'show':
            if (item.show_details?.start_year) {
                const years = item.show_details.end_year ? `${item.show_details.start_year}-${item.show_details.end_year}` : String(item.show_details.start_year);
                details.push(['Years', years]);
            }
            break;
        case 'restaurant':
            if (item.restaurant_details?.price_range) details.push(['Price', item.restaurant_details.price_range]);
            if (item.restaurant_details?.address) details.push(['Address', item.restaurant_details.address]);
            break;
    }
    return details;
};