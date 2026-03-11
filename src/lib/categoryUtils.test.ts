import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CategoryDefinition } from '@/types/types';

// ---------------------------------------------------------------------------
// Supabase mock
//
// We mock the entire supabaseClient module. The mock factory creates vi.fn()
// stubs for the Supabase query chain (.from → .select → .order) and .rpc.
// Because vi.mock is hoisted above all imports, any variables it references
// must also be hoisted via vi.hoisted() so they are initialised in time.
// ---------------------------------------------------------------------------

const { mockOrder, mockSelect, mockFrom, mockRpc } = vi.hoisted(() => {
  const mockOrder = vi.fn();
  const mockSelect = vi.fn(() => ({ order: mockOrder }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  const mockRpc = vi.fn();
  return { mockOrder, mockSelect, mockFrom, mockRpc };
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
    // Restore default chain return so each test starts from a clean slate
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('returns existing categories directly without calling the seed RPC', async () => {
    mockOrder.mockResolvedValueOnce({ data: [sampleCategory], error: null });

    const result = await ensureUserCategories();

    expect(result).toEqual([sampleCategory]);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('calls the seed RPC and re-fetches when no categories exist', async () => {
    const seededCategory: CategoryDefinition = { ...sampleCategory, id: 'cat-seeded' };

    mockOrder
      .mockResolvedValueOnce({ data: [], error: null }) // first fetch: empty
      .mockResolvedValueOnce({ data: [seededCategory], error: null }); // post-seed re-fetch
    mockRpc.mockResolvedValueOnce({ error: null });

    const result = await ensureUserCategories();

    expect(mockRpc).toHaveBeenCalledWith('seed_user_categories');
    expect(result).toEqual([seededCategory]);
  });

  it('returns an empty array when the seed RPC succeeds but re-fetch returns null data', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({ data: null, error: null });
    mockRpc.mockResolvedValueOnce({ error: null });

    const result = await ensureUserCategories();

    expect(result).toEqual([]);
  });

  it('throws when the initial fetch returns an error', async () => {
    const dbError = { message: 'connection refused', code: '503', details: '', hint: '' };
    mockOrder.mockResolvedValueOnce({ data: null, error: dbError });

    await expect(ensureUserCategories()).rejects.toEqual(dbError);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('throws when the seed RPC returns an error', async () => {
    const rpcError = { message: 'rpc failed', code: '500', details: '', hint: '' };
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    mockRpc.mockResolvedValueOnce({ error: rpcError });

    await expect(ensureUserCategories()).rejects.toEqual(rpcError);
  });

  it('queries the category_definitions table ordered by created_at ascending', async () => {
    mockOrder.mockResolvedValueOnce({ data: [sampleCategory], error: null });

    await ensureUserCategories();

    expect(mockFrom).toHaveBeenCalledWith('category_definitions');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true });
  });
});
