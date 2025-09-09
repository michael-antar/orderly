import { type ComponentType } from 'react';

import { supabase } from '@/lib/supabaseClient';

import { AlbumFields } from '@/components/forms/AlbumFields';
import { BookFields } from '@/components/forms/BookFields';
import { MovieFields } from '@/components/forms/MovieFields';
import { RestaurantFields } from '@/components/forms/RestaurantFields';
import { ShowFields } from '@/components/forms/ShowFields';

import {
    type Category,
    type CategoryFieldsProps,
    type SupabaseMutationResponse,
    type DetailsMap,
    type DetailTableNames,
    type FilterField,
    type AlbumDetails,
    type BookDetails,
    type MovieDetails,
    type RestaurantDetails,
    type ShowDetails,
} from '@/types/types';

export type FilterableField = {
    value: FilterField;
    label: string;
    type: 'string' | 'number' | 'price_range'; // Added type property
};

type CategoryConfigMap = {
    [K in Category]: {
        FieldsComponent: ComponentType<CategoryFieldsProps>;
        handleDetailsInsert: (
            itemId: string,
            details: DetailsMap[K],
        ) => SupabaseMutationResponse;
        handleDetailsUpdate: (
            itemId: string,
            details: Partial<DetailsMap[K]>,
        ) => SupabaseMutationResponse;
        fields: Array<keyof DetailsMap[K]>;
        filterableFields: FilterableField[];
    };
};

/**
 * A generic factory function to create Supabase insert and update handlers.
 * @param tableName - The name of the Supabase table (e.g., 'album_details').
 * @returns An object with `handleDetailsInsert` and `handleDetailsUpdate` methods.
 */
const createDetailsHandlers = <T extends object>(
    detailTableName: DetailTableNames,
) => ({
    handleDetailsInsert: async (itemId: string, details: T) => {
        return await supabase
            .from(detailTableName)
            .insert({ item_id: itemId, ...details });
    },
    handleDetailsUpdate: async (itemId: string, details: Partial<T>) => {
        return await supabase
            .from(detailTableName)
            .update(details)
            .eq('item_id', itemId);
    },
});

export const categoryConfig: CategoryConfigMap = {
    album: {
        FieldsComponent: AlbumFields,
        ...createDetailsHandlers<AlbumDetails>('album_details'),
        fields: ['artist', 'release_year'],
        filterableFields: [
            { value: 'artist', label: 'Artist', type: 'string' },
            { value: 'release_year', label: 'Release Year', type: 'number' },
        ],
    },
    book: {
        FieldsComponent: BookFields,
        ...createDetailsHandlers<BookDetails>('book_details'),
        fields: ['author', 'release_year', 'series_name', 'series_order'],
        filterableFields: [
            { value: 'author', label: 'Author', type: 'string' },
            { value: 'release_year', label: 'Release Year', type: 'number' },
            { value: 'series_name', label: 'Series Name', type: 'string' },
            { value: 'series_order', label: 'Series Order', type: 'number' },
        ],
    },
    movie: {
        FieldsComponent: MovieFields,
        ...createDetailsHandlers<MovieDetails>('movie_details'),
        fields: ['director', 'release_year'],
        filterableFields: [
            { value: 'director', label: 'Director', type: 'string' },
            { value: 'release_year', label: 'Release Year', type: 'number' },
        ],
    },
    restaurant: {
        FieldsComponent: RestaurantFields,
        ...createDetailsHandlers<RestaurantDetails>('restaurant_details'),
        fields: ['address', 'price_range'],
        filterableFields: [
            { value: 'address', label: 'Address', type: 'string' },
            { value: 'price_range', label: 'Price Range', type: 'price_range' },
        ],
    },
    show: {
        FieldsComponent: ShowFields,
        ...createDetailsHandlers<ShowDetails>('show_details'),
        fields: ['start_year', 'end_year'],
        filterableFields: [
            { value: 'start_year', label: 'Start Year', type: 'number' },
            { value: 'end_year', label: 'End Year', type: 'number' },
        ],
    },
};
