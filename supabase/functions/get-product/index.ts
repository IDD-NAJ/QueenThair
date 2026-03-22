import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { findById, type ProductInclude } from '../_shared/productRepository.ts';
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
  const id = url.searchParams.get('id');
  const includeParam = url.searchParams.get('include') ?? '';
  const include = includeParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as ProductInclude[];

  if (!id) {
    return jsonResponse(
      { data: null, meta: {}, error: { code: 'BAD_REQUEST', message: 'Missing id' } },
      400
    );
  }

  const started = performance.now();

  try {
    const row = await findById(id, { include });
    const domain = entityToDomain(row);
    const dto = domainToDTO(domain, 'detail');

    const latencyMs = performance.now() - started;
    console.log(
      JSON.stringify({
        event: 'product_read',
        productId: id,
        include,
        latencyMs,
      })
    );

    return jsonResponse({ data: dto, meta: {}, error: null }, 200);
  } catch (err) {
    console.error('[get-product]', err);
    return jsonResponse(
      {
        data: null,
        meta: {},
        error: {
          code: 'NOT_FOUND',
          message: err instanceof Error ? err.message : 'Product not found',
        },
      },
      404
    );
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
    status,
  });
}

