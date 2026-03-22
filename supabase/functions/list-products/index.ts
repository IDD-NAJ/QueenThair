import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { findMany, type ProductInclude } from '../_shared/productRepository.ts';
import { entityToDomain, domainToDTO } from '../_shared/productMappers.ts';

const CORS = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const pageSize = Number(searchParams.get('pageSize') ?? '20') || 20;

  const includeParam = searchParams.get('include') ?? '';
  const include = includeParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as ProductInclude[];

  const filters = {
    productType: (searchParams.get('productType') as 'wig' | 'accessory' | null) ?? undefined,
    categorySlug: searchParams.get('categorySlug') ?? undefined,
    featured: searchParams.get('featured') === 'true' || undefined,
    newArrival: searchParams.get('newArrival') === 'true' || undefined,
    bestSeller: searchParams.get('bestSeller') === 'true' || undefined,
    onSale: searchParams.get('onSale') === 'true' || undefined,
    minPrice:
      searchParams.get('minPrice') != null
        ? Number(searchParams.get('minPrice'))
        : undefined,
    maxPrice:
      searchParams.get('maxPrice') != null
        ? Number(searchParams.get('maxPrice'))
        : undefined,
  };

  const started = performance.now();

  try {
    const { items, total } = await findMany(filters, { page, pageSize }, { include });
    const domains = items.map((row) => entityToDomain(row));
    const dtos = domains.map((d) => domainToDTO(d, 'list'));

    const latencyMs = performance.now() - started;
    console.log(
      JSON.stringify({
        event: 'product_list',
        filters,
        include,
        total,
        page,
        pageSize,
        latencyMs,
      })
    );

    return jsonResponse(
      {
        data: dtos,
        meta: { total, page, pageSize },
        error: null,
      },
      200
    );
  } catch (err) {
    console.error('[list-products]', err);
    return jsonResponse(
      {
        data: [],
        meta: { total: 0, page, pageSize },
        error: {
          code: 'INTERNAL',
          message: err instanceof Error ? err.message : 'Failed to list products',
        },
      },
      500
    );
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
    status,
  });
}

