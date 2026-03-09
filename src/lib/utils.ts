import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { FieldDefinition, Item, ItemPropertyValue, LocationValue } from '@/types/types';

/**
 * Merges Tailwind CSS class names, resolving conflicts via `tailwind-merge`
 * and handling conditional classes via `clsx`.
 *
 * @param inputs - Any number of class values (strings, arrays, or objects).
 * @returns A single merged and deduplicated class name string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a single dynamic field value as a plain text string.
 * Dates are rendered as a year only (compact format suitable for cards/subtitles).
 * Returns an empty string for null, undefined, or empty values.
 *
 * @param field - The field definition describing the type.
 * @param value - The raw value from `item.properties`.
 * @returns A human-readable string, or `''` if the value is empty.
 */
export const formatFieldValueAsText = (field: FieldDefinition, value: ItemPropertyValue): string => {
  if (value === null || value === undefined || value === '') return '';

  switch (field.type) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'date': {
      const localDate = new Date(`${value as string}T00:00:00`);
      return isNaN(localDate.getTime()) ? String(value) : String(localDate.getFullYear());
    }
    case 'location':
      return (value as LocationValue).address || '';
    default:
      return String(value);
  }
};

/**
 * Extracts an ordered list of `[label, value]` string pairs from an item's dynamic
 * `properties` object, using the category's `field_definitions` as the schema source.
 * Values are formatted via `formatFieldValueAsText` — compact, plain-text representations
 * suitable for card subtitles. Returns at most 3 entries; empty values are skipped.
 *
 * @param item - The item whose `properties` will be read.
 * @param fieldDefinitions - The ordered field schema for the item's parent category.
 * @returns An ordered array of `[label, value]` string tuples, capped at 3 entries.
 */
export const getCategoryDetails = (item: Item, fieldDefinitions: FieldDefinition[]): [string, string][] => {
  const details: [string, string][] = [];

  for (const field of fieldDefinitions) {
    const formatted = formatFieldValueAsText(field, item.properties[field.key]);
    if (formatted) details.push([field.label, formatted]);
    if (details.length === 3) break;
  }

  return details;
};
