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
   * Ranked items always sorted by Elo descending — used as the stable input
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
      // Base query
      let query = supabase
        .from('items')
        .select('*, tags(*)')
        .eq('user_id', user.id)
        .eq('category_def_id', categoryDef.id);

      // Rebuild with an INNER JOIN when filtering by tags so only items that
      // have ALL specified tags are returned (Supabase requires `tags!inner`).
      if (filters.tags.length > 0) {
        const tagIds = filters.tags.map((tag) => tag.id);
        query = supabase
          .from('items')
          .select('*, tags!inner(*)')
          .eq('user_id', user.id)
          .eq('category_def_id', categoryDef.id)
          .in('tags.id', tagIds);
      }

      // Apply field-level filter rules
      const standardColumns = ['id', 'name', 'status', 'rating', 'created_at', 'description'];

      filters.rules.forEach((rule) => {
        if (!rule.field_key || !rule.operator || rule.value === '') return;

        let column = rule.field_key;

        if (column.startsWith('properties.')) {
          const key = column.split('.')[1];
          // Use ->> (text extraction) for JSONB property access
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
      // to avoid lexicographic comparison (where "9" > "10" as text).
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

      setItems((data as Item[]) || []);
      return { data: (data as Item[]) || null, error: null };
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
