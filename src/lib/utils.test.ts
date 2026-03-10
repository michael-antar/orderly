import { describe, expect, it } from 'vitest';

import type { FieldDefinition, Item, LocationValue } from '@/types/types';

import { formatFieldValueAsText, getCategoryDetails } from './utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal FieldDefinition for use in tests. */
const field = (type: FieldDefinition['type'], key = 'k', label = 'Label'): FieldDefinition => ({ key, type, label });

/** Builds a minimal Item with the given properties map. */
const itemWithProps = (properties: Item['properties']): Item => ({
  id: 'item-1',
  user_id: 'user-1',
  category_def_id: 'cat-1',
  name: 'Test Item',
  status: 'ranked',
  rating: 1000,
  description: null,
  comparison_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  tags: null,
  properties,
});

// ---------------------------------------------------------------------------
// formatFieldValueAsText
// ---------------------------------------------------------------------------

describe('formatFieldValueAsText', () => {
  // --- Empty / null guards ---

  it('returns "" for null', () => {
    expect(formatFieldValueAsText(field('string'), null)).toBe('');
  });

  it('returns "" for undefined', () => {
    // undefined is not in ItemPropertyValue but can arrive at runtime via
    // item.properties[missingKey]; cast to test the guard explicitly.
    expect(formatFieldValueAsText(field('string'), undefined as unknown as null)).toBe('');
  });

  it('returns "" for empty string', () => {
    expect(formatFieldValueAsText(field('string'), '')).toBe('');
  });

  // --- Boolean ---

  it('returns "Yes" for boolean true', () => {
    expect(formatFieldValueAsText(field('boolean'), true)).toBe('Yes');
  });

  it('returns "No" for boolean false', () => {
    expect(formatFieldValueAsText(field('boolean'), false)).toBe('No');
  });

  // --- Date ---

  it('returns the year string for a valid ISO date', () => {
    expect(formatFieldValueAsText(field('date'), '2023-07-15')).toBe('2023');
  });

  it('returns the year string for a date at year boundaries', () => {
    expect(formatFieldValueAsText(field('date'), '2000-01-01')).toBe('2000');
  });

  it('returns the raw string when the date is invalid', () => {
    expect(formatFieldValueAsText(field('date'), 'not-a-date')).toBe('not-a-date');
  });

  // --- Location ---

  it('returns the address for a location value', () => {
    const loc: LocationValue = { address: '123 Main St', coordinates: null };
    expect(formatFieldValueAsText(field('location'), loc)).toBe('123 Main St');
  });

  it('returns "" for a location with an empty address', () => {
    const loc: LocationValue = { address: '', coordinates: null };
    expect(formatFieldValueAsText(field('location'), loc)).toBe('');
  });

  it('returns the address even when coordinates are present', () => {
    const loc: LocationValue = {
      address: 'Paris, France',
      coordinates: { lat: 48.8566, lng: 2.3522 },
    };
    expect(formatFieldValueAsText(field('location'), loc)).toBe('Paris, France');
  });

  // --- Number / String / Select (default branch) ---

  it('converts a number value to its string representation', () => {
    expect(formatFieldValueAsText(field('number'), 42)).toBe('42');
  });

  it('returns a string value unchanged', () => {
    expect(formatFieldValueAsText(field('string'), 'hello')).toBe('hello');
  });

  it('returns a select value unchanged', () => {
    expect(formatFieldValueAsText(field('select'), 'Action')).toBe('Action');
  });
});

// ---------------------------------------------------------------------------
// getCategoryDetails
// ---------------------------------------------------------------------------

describe('getCategoryDetails', () => {
  it('returns an empty array when there are no field definitions', () => {
    expect(getCategoryDetails(itemWithProps({}), [])).toEqual([]);
  });

  it('returns an empty array when all field values are empty', () => {
    const item = itemWithProps({ title: null, year: '' });
    const defs = [field('string', 'title', 'Title'), field('number', 'year', 'Year')];
    expect(getCategoryDetails(item, defs)).toEqual([]);
  });

  it('skips fields with null values', () => {
    const item = itemWithProps({ title: null, year: 2020 });
    const defs = [field('string', 'title', 'Title'), field('number', 'year', 'Year')];
    expect(getCategoryDetails(item, defs)).toEqual([['Year', '2020']]);
  });

  it('skips fields with empty string values', () => {
    const item = itemWithProps({ title: '', year: 2020 });
    const defs = [field('string', 'title', 'Title'), field('number', 'year', 'Year')];
    expect(getCategoryDetails(item, defs)).toEqual([['Year', '2020']]);
  });

  it('returns formatted [label, value] tuples for present fields', () => {
    const item = itemWithProps({ title: 'Inception', year: 2010 });
    const defs = [field('string', 'title', 'Title'), field('number', 'year', 'Year')];
    expect(getCategoryDetails(item, defs)).toEqual([
      ['Title', 'Inception'],
      ['Year', '2010'],
    ]);
  });

  it('caps the result at 3 entries when more than 3 fields have values', () => {
    const item = itemWithProps({ a: '1', b: '2', c: '3', d: '4' });
    const defs = [
      field('string', 'a', 'A'),
      field('string', 'b', 'B'),
      field('string', 'c', 'C'),
      field('string', 'd', 'D'),
    ];
    const result = getCategoryDetails(item, defs);
    expect(result).toHaveLength(3);
    expect(result).toEqual([
      ['A', '1'],
      ['B', '2'],
      ['C', '3'],
    ]);
  });

  it('still reaches 3 entries when earlier fields are empty', () => {
    const item = itemWithProps({ a: '', b: '2', c: '3', d: '4' });
    const defs = [
      field('string', 'a', 'A'),
      field('string', 'b', 'B'),
      field('string', 'c', 'C'),
      field('string', 'd', 'D'),
    ];
    const result = getCategoryDetails(item, defs);
    expect(result).toHaveLength(3);
    expect(result).toEqual([
      ['B', '2'],
      ['C', '3'],
      ['D', '4'],
    ]);
  });

  it('respects the ordering of field definitions', () => {
    // 'z' appears first in the defs, even though 'a' comes first alphabetically
    const item = itemWithProps({ z: 'last-key', a: 'first-key' });
    const defs = [field('string', 'a', 'A'), field('string', 'z', 'Z')];
    expect(getCategoryDetails(item, defs)).toEqual([
      ['A', 'first-key'],
      ['Z', 'last-key'],
    ]);
  });

  it('handles a boolean field correctly', () => {
    const item = itemWithProps({ watched: true });
    const defs = [field('boolean', 'watched', 'Watched')];
    expect(getCategoryDetails(item, defs)).toEqual([['Watched', 'Yes']]);
  });

  it('handles a date field by returning only the year', () => {
    const item = itemWithProps({ release: '1999-03-31' });
    const defs = [field('date', 'release', 'Release')];
    expect(getCategoryDetails(item, defs)).toEqual([['Release', '1999']]);
  });

  it('handles a location field by returning the address', () => {
    const loc: LocationValue = { address: 'Tokyo, Japan', coordinates: null };
    const item = itemWithProps({ venue: loc });
    const defs = [field('location', 'venue', 'Venue')];
    expect(getCategoryDetails(item, defs)).toEqual([['Venue', 'Tokyo, Japan']]);
  });
});
