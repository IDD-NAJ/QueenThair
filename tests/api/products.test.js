import { describe, it, expect, beforeEach, vi } from 'vitest';

// We import the module under test after setting up fetch so it can see the mock.
import { listProducts } from '../../src/api/products';

describe('products API client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('wraps successful list-products responses into items/meta structure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        data: [{ id: 'p1', name: 'Test Product' }],
        meta: { total: 1, page: 1, pageSize: 20 },
        error: null,
      }),
      status: 200,
    });

    const result = await listProducts(
      { productType: 'wig' },
      { page: 1, pageSize: 20 },
      { include: ['images', 'category'] }
    );

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
}

