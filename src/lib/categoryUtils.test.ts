import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CategoryDefinition } from '@/types/types';

// ---------------------------------------------------------------------------
// Supabase mock
//
// We mock the entire supabaseClient module with a chainable mock factory.
// Each `from()` call returns a fresh chain where every query method returns
// the chain itself, and the chain is thenable (resolves to a configurable result).
// ---------------------------------------------------------------------------

const { mockFrom, mockRpc, createChain } = vi.hoisted(() => {
  const mockRpc = vi.fn();

  /** Creates a chainable mock that resolves to `result` when awaited. */
  function createChain(result: { data: any; error: any } = { data: null, error: null }) {
    const chain: Record<string, any> = {};
    for (const method of ['select', 'eq', 'in', 'is', 'order', 'update', 'single', 'delete']) {
      chain[method] = vi.fn(() => chain);
    }
    chain.then = (onResolve: any, onReject?: any) => Promise.resolve(result).then(onResolve, onReject);
    return chain;
  }

  const mockFrom = vi.fn(() => createChain());
  return { mockFrom, mockRpc, createChain };
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
}));

// Import AFTER the mock is registered
import { ensureUserCategories } from './categoryUtils';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleCategory: CategoryDefinition = {
  id: 'cat-1',
  user_id: 'user-1',
  name: 'Movies',
  icon: 'film',
  field_definitions: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ensureUserCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing categories directly without calling the seed RPC', async () => {
    mockFrom.mockReturnValueOnce(createChain({ data: [sampleCategory], error: null }));

    const result = await ensureUserCategories('user-1');

    expect(result).toEqual([sampleCategory]);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('calls the seed RPC and re-fetches when no categories exist', async () => {
    const seededCategory: CategoryDefinition = { ...sampleCategory, id: 'cat-seeded' };

    mockFrom
      .mockReturnValueOnce(createChain({ data: [], error: null })) // user check: empty
      .mockReturnValueOnce(createChain({ data: [seededCategory], error: null })) // post-seed re-fetch
      .mockReturnValueOnce(createChain({ data: [], error: null })); // migration: fetch globals → none
    mockRpc.mockResolvedValueOnce({ error: null });

    const result = await ensureUserCategories('user-1');

    expect(mockRpc).toHaveBeenCalledWith('seed_user_categories');
    expect(result).toEqual([seededCategory]);
  });

  it('returns an empty array when the seed RPC succeeds but re-fetch returns null data', async () => {
    mockFrom
      .mockReturnValueOnce(createChain({ data: [], error: null })) // user check: empty
      .mockReturnValueOnce(createChain({ data: null, error: null })); // post-seed re-fetch → null (migration skipped)
    mockRpc.mockResolvedValueOnce({ error: null });

    const result = await ensureUserCategories('user-1');

    expect(result).toEqual([]);
  });

  it('throws when the initial fetch returns an error', async () => {
    const dbError = { message: 'connection refused', code: '503', details: '', hint: '' };
    mockFrom.mockReturnValueOnce(createChain({ data: null, error: dbError }));

    await expect(ensureUserCategories('user-1')).rejects.toEqual(dbError);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('throws when the seed RPC returns an error', async () => {
    const rpcError = { message: 'rpc failed', code: '500', details: '', hint: '' };
    mockFrom.mockReturnValueOnce(createChain({ data: [], error: null }));
    mockRpc.mockResolvedValueOnce({ error: rpcError });

    await expect(ensureUserCategories('user-1')).rejects.toEqual(rpcError);
  });

  it('queries the category_definitions table filtered by user_id and ordered by created_at', async () => {
    const chain = createChain({ data: [sampleCategory], error: null });
    mockFrom.mockReturnValueOnce(chain);

    await ensureUserCategories('user-1');

    expect(mockFrom).toHaveBeenCalledWith('category_definitions');
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('migrates items and tags from global categories to user-owned after seeding', async () => {
    const globalCategory: CategoryDefinition = { ...sampleCategory, id: 'global-1', user_id: null };
    const seededCategory: CategoryDefinition = { ...sampleCategory, id: 'cat-seeded' };

    const itemUpdateChain = createChain({ data: null, error: null });
    const tagUpdateChain = createChain({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(createChain({ data: [], error: null })) // 1. user check → empty
      .mockReturnValueOnce(createChain({ data: [seededCategory], error: null })) // 2. post-seed re-fetch
      .mockReturnValueOnce(createChain({ data: [globalCategory], error: null })) // 3. migration: globals
      .mockReturnValueOnce(createChain({ data: [{ id: 'item-1', category_def_id: 'global-1' }], error: null })) // 4. orphaned items check
      .mockReturnValueOnce(itemUpdateChain) // 5. update items
      .mockReturnValueOnce(createChain({ data: [{ id: 1, category_def_id: 'global-1' }], error: null })) // 6. orphaned tags check
      .mockReturnValueOnce(tagUpdateChain); // 7. update tags
    mockRpc.mockResolvedValueOnce({ error: null });

    const result = await ensureUserCategories('user-1');

    expect(result).toEqual([seededCategory]);
    expect(itemUpdateChain.update).toHaveBeenCalledWith({ category_def_id: 'cat-seeded' });
    expect(tagUpdateChain.update).toHaveBeenCalledWith({ category_def_id: 'cat-seeded' });
  });
});
