import type { PostgrestError } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePrevious } from '@/hooks/usePrevious';
import { supabase } from '@/lib/supabaseClient';
import type { AppliedFilters, CategoryDefinition, Item } from '@/types/types';

export interface UseCategoryItemsReturn {
  /** Full flat list of items for the current category. */
  items: Item[];
  loading: boolean;
  error: PostgrestError | null;
  /** Items filtered to `status === 'ranked'`, in fetch order. */
  rankedItems: Item[];
  /** Items filtered to `status === 'backlog'`, in fetch order. */
  backlogItems: Item[];
  /**
   * Ranked items always sorted by rating descending — used as the stable input
   * for the comparison modal regardless of the active sort/filter selection.
   */
  comparisonRankedItems: Item[];
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
  sortAsc: boolean;
  setSortAsc: React.Dispatch<React.SetStateAction<boolean>>;
  filters: AppliedFilters;
  setFilters: React.Dispatch<React.SetStateAction<AppliedFilters>>;
  /**
   * Executes the Supabase query with the current sort/filter state and updates
   * `items`. Returns the fetched data so callers can act on it immediately
   * (e.g. to determine whether to open the comparison modal after an add).
   */
  getItems: () => Promise<{ data: Item[] | null; error: PostgrestError | null }>;
}

const DEFAULT_FILTERS: AppliedFilters = { tags: [], rules: [] };

/**
 * Manages all data-fetching, sorting, and filtering state for a category's item list.
 *
 * Handles:
 * - Fetching items from Supabase with dynamic filter/sort parameters.
 * - Automatic reset of sort/filter state when switching to a different category.
 *   A same-ID guard prevents resetting when the user edits the current category's schema.
 *
 * @param categoryDef - The active category definition (changes trigger a data re-fetch).
 * @param user - The authenticated Supabase user. Fetch is skipped when `null`.
 */
export function useCategoryItems(categoryDef: CategoryDefinition, user: User | null): UseCategoryItemsReturn {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const [sortBy, setSortBy] = useState<string>('rating');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [filters, setFilters] = useState<AppliedFilters>(DEFAULT_FILTERS);

  const prevCategoryId = usePrevious(categoryDef.id);

  const getItems = useCallback(async () => {
    if (!user || !categoryDef) return { data: [], error: null };

    setLoading(true);
    setError(null);

    try {
      // Always fetch with a LEFT JOIN so every item retains its full tag list,
      // regardless of which tags (if any) the user is filtering on.
      let query = supabase
        .from('items')
        .select('*, tags(*)')
        .eq('user_id', user.id)
        .eq('category_def_id', categoryDef.id);

      // --- Split filter rules into server-side and client-side ---
      // Numeric property comparisons (gt/gte/lt/lte) must be applied client-side
      // because `properties->>'key'` returns text; Supabase/PostgREST would
      // compare lexicographically ("9" > "10") which is incorrect for numbers.
      const standardColumns = ['id', 'name', 'status', 'rating', 'created_at', 'description'];

      type FilterRule = (typeof filters.rules)[number];
      const clientNumericRules: FilterRule[] = [];

      filters.rules.forEach((rule) => {
        if (!rule.field_key || !rule.operator || rule.value === '') return;

        // Detect numeric dynamic-property rules that need client-side handling
        if (['gt', 'gte', 'lt', 'lte'].includes(rule.operator) && rule.field_key.startsWith('properties.')) {
          const key = rule.field_key.split('.')[1];
          const fieldDef = categoryDef.field_definitions.find((f) => f.key === key);
          if (fieldDef?.type === 'number') {
            clientNumericRules.push(rule);
            return; // Don't add to server query
          }
        }

        let column = rule.field_key;

        if (column.startsWith('properties.')) {
          const key = column.split('.')[1];
          column = `properties->>${key}`;
        } else if (!standardColumns.includes(column)) {
          column = `properties->>${column}`;
        }

        const val = String(rule.value);

        switch (rule.operator) {
          case 'is':
            query = query.eq(column, val);
            break;
          case 'is_not':
            query = query.neq(column, val);
            break;
          case 'contains':
            query = query.ilike(column, `%${val}%`);
            break;
          case 'gt':
            query = query.gt(column, val);
            break;
          case 'gte':
            query = query.gte(column, val);
            break;
          case 'lt':
            query = query.lt(column, val);
            break;
          case 'lte':
            query = query.lte(column, val);
            break;
        }
      });

      // Apply sorting. Number-typed dynamic fields use an explicit ::numeric cast
      // so PostgREST orders numerically rather than lexicographically.
      // NOTE: This relies on PostgREST supporting inline type casts in the
      // `order` parameter — verified to work with Supabase-hosted PostgREST.
      let sortColumn = sortBy;
      if (sortBy.startsWith('properties.')) {
        const key = sortBy.split('.')[1];
        const fieldDef = categoryDef.field_definitions.find((f) => f.key === key);
        sortColumn = fieldDef?.type === 'number' ? `(properties->>'${key}')::numeric` : `properties->>'${key}'`;
      }

      const { data, error } = await query.order(sortColumn, {
        ascending: sortAsc,
        nullsFirst: false,
      });

      if (error) throw error;

      let filteredData: Item[] = (data as Item[]) || [];

      // --- Client-side: ALL-match tag filter ---
      // Applied client-side because PostgREST's `.in('tags.id', …)` returns
      // items matching ANY of the specified tags (OR), not ALL of them (AND).
      if (filters.tags.length > 0) {
        const requiredTagIds = new Set(filters.tags.map((tag) => tag.id));
        filteredData = filteredData.filter((item) => {
          const itemTagIds = new Set((item.tags ?? []).map((t: { id: number }) => t.id));
          return [...requiredTagIds].every((id) => itemTagIds.has(id));
        });
      }

      // --- Client-side: Numeric property comparison filters ---
      if (clientNumericRules.length > 0) {
        filteredData = filteredData.filter((item) =>
          clientNumericRules.every((rule) => {
            const key = rule.field_key.split('.')[1];
            const raw = item.properties?.[key];
            if (raw == null) return false;
            const numVal = Number(raw);
            const threshold = Number(rule.value);
            if (isNaN(numVal) || isNaN(threshold)) return false;

            switch (rule.operator) {
              case 'gt':
                return numVal > threshold;
              case 'gte':
                return numVal >= threshold;
              case 'lt':
                return numVal < threshold;
              case 'lte':
                return numVal <= threshold;
              default:
                return true;
            }
          }),
        );
      }

      setItems(filteredData);
      return { data: filteredData, error: null };
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err as PostgrestError);
      return { data: [], error: err as PostgrestError };
    } finally {
      setLoading(false);
    }
  }, [user, categoryDef, filters, sortBy, sortAsc]);

  // Fetch on mount and whenever sort/filter state changes (getItems dep changes).
  useEffect(() => {
    if (categoryDef) getItems();
  }, [categoryDef, getItems]);

  // Reset sort/filter when switching to a different category.
  // Guard: skips if prevCategoryId === categoryDef.id so editing the current
  // category's schema does not clear the user's active sort/filter selection.
  useEffect(() => {
    if (prevCategoryId !== undefined && prevCategoryId === categoryDef.id) return;
    setSortBy('rating');
    setSortAsc(false);
    setFilters(DEFAULT_FILTERS);
  }, [categoryDef.id, prevCategoryId]);

  const rankedItems = useMemo(() => items.filter((item) => item.status === 'ranked'), [items]);
  const backlogItems = useMemo(() => items.filter((item) => item.status === 'backlog'), [items]);

  const comparisonRankedItems = useMemo(
    () =>
      [...rankedItems].sort((a, b) => {
        if (a.rating === null) return 1;
        if (b.rating === null) return -1;
        return b.rating - a.rating;
      }),
    [rankedItems],
  );

  return {
    items,
    loading,
    error,
    rankedItems,
    backlogItems,
    comparisonRankedItems,
    sortBy,
    setSortBy,
    sortAsc,
    setSortAsc,
    filters,
    setFilters,
    getItems,
  };
}
