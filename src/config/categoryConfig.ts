import { supabase } from "@/lib/supabaseClient";
import { 
    type Category, 
    type DetailTableNames,
    type AlbumDetails, 
    type BookDetails, 
    type MovieDetails, 
    type RestaurantDetails, 
    type ShowDetails 
} from "@/types/types";

import { AlbumFields } from "@/components/forms/AlbumFields";
import { BookFields } from "@/components/forms/BookFields";
import { MovieFields } from "@/components/forms/MovieFields";
import { RestaurantFields } from "@/components/forms/RestaurantFields";
import { ShowFields } from "@/components/forms/ShowFields";


type CategoryConfig = {
    FieldsComponent: React.ComponentType<any>; // Renders the category-specific fields
    handleDetailsInsert: (itemId: string, details: any) => Promise<any>;
    handleDetailsUpdate: (itemId: string, details: any) => Promise<any>;
};

/**
 * A generic factory function to create Supabase insert and update handlers.
 * @param tableName - The name of the Supabase table (e.g., 'album_details').
 * @returns An object with `handleDetailsInsert` and `handleDetailsUpdate` methods.
 */
const createDetailsHandlers = <T extends object>(detailTableName: DetailTableNames) => ({
    handleDetailsInsert: async (itemId: string, details: T) => {
        return await supabase.from(detailTableName).insert({item_id: itemId, ...details});
    },
    handleDetailsUpdate: async (itemId: string, details: Partial<T>) => {
        return await supabase.from(detailTableName).update(details).eq('item_id', itemId)
    },
});

export const categoryConfig: Record<Category, CategoryConfig> = {
    album: {
        FieldsComponent: AlbumFields,
        ...createDetailsHandlers<AlbumDetails>('album_details'),
    },
    book: {
        FieldsComponent: BookFields,
        ...createDetailsHandlers<BookDetails>('book_details'),
    },
    movie: {
        FieldsComponent: MovieFields,
        ...createDetailsHandlers<MovieDetails>('movie_details'),
    },
    restaurant: {
        FieldsComponent: RestaurantFields,
        ...createDetailsHandlers<RestaurantDetails>('restaurant_details'),
    },
    show: {
        FieldsComponent: ShowFields,
        ...createDetailsHandlers<ShowDetails>('show_details'),
    },
};