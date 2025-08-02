import { supabase } from "@/lib/supabaseClient";
import { type Category, type AlbumDetails, type BookDetails, type MovieDetails, type RestaurantDetails, type ShowDetails } from "@/types/types";

import { AlbumFields } from "@/components/forms/AlbumFields";
import { BookFields } from "@/components/forms/BookFields";
import { MovieFields } from "@/components/forms/MovieFields";
import { RestaurantFields } from "@/components/forms/RestaurantFields";
import { ShowFields } from "@/components/forms/ShowFields";


type CategoryConfig = {
    FieldsComponent: React.ComponentType<any>; // Renders the category-specific fields
    handleDetailsInsert: (itemId: string, details: any) => Promise<any>; // Handles inserting data into the details table
};

// Configuration map
export const categoryConfig: Record<Category, CategoryConfig> = {
    album: {
        FieldsComponent: AlbumFields,
        handleDetailsInsert: async (itemId, details: AlbumDetails) => {
            return supabase.from('album_details').insert({
                item_id: itemId,
                artist: details.artist,
                release_year: details.release_year,
            });
        },
    },
    book: {
        FieldsComponent: BookFields,
        handleDetailsInsert: async (itemId, details: BookDetails) => {
            return supabase.from('book_details').insert({
                item_id: itemId,
                author: details.author,
                release_year: details.release_year,
            });
        },
    },
    movie: {
        FieldsComponent: MovieFields,
        handleDetailsInsert: async (itemId, details: MovieDetails) => {
            return supabase.from('movie_details').insert({
                item_id: itemId,
                director: details.director,
                release_year: details.release_year,
            });
        },
    },
    restaurant: {
        FieldsComponent: RestaurantFields,
        handleDetailsInsert: async (itemId, details: RestaurantDetails) => {
            return supabase.from('restaurant_details').insert({
                item_id: itemId,
                address: details.address,
                price_range: details.price_range,
            });
        },
    },
    show: {
        FieldsComponent: ShowFields,
        handleDetailsInsert: async (itemId, details: ShowDetails) => {
            return supabase.from('show_details').insert({
                item_id: itemId,
                start_year: details.start_year,
                end_year: details.end_year,
            });
        },
    },
};