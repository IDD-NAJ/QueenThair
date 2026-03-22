### Product API v2 Rollout Plan

This document describes how the `product_api_v2` feature flag controls rollout of the new product API (Supabase edge functions + DTO pipeline) and how to safely migrate traffic from the legacy service layer.

---

### 1. Feature Flag Contract

- **Flag name (frontend env)**: `VITE_FEATURE_PRODUCT_API_V2`
- **Frontend binding**: `env.productApiV2` (see `src/lib/env.js`)
- **Primary call site**: `src/api/products.js`
  - When `env.productApiV2 === true`:
    - `getProduct`, `listProducts`, `searchProducts` call Supabase edge functions:
      - `/functions/v1/get-product`
      - `/functions/v1/list-products`
      - `/functions/v1/search-products`
  - When `env.productApiV2 === false`:
    - `getProduct` delegates to `productService.getProductById`
    - `listProducts` delegates to `productService.getProducts`
    - `searchProducts` delegates to `searchService.searchProducts`

**Guarantee**: React pages only import `src/api/products.js`, so switching the flag cleanly moves reads between v1 (direct Supabase services) and v2 (edge functions + DTOs) without touching page/component code.

---

### 2. Rollout Stages

1. **Stage 1 – Local/Staging Only**
   - Set `VITE_FEATURE_PRODUCT_API_V2=true` in `.env.local` / staging env.
   - Verify:
     - Product detail, listing, search, wishlist, and admin product screens behave identically between `true` and `false`.
     - Edge function logs show healthy traffic and no schema/DTO mismatches.
2. **Stage 2 – Internal Accounts / Low % Traffic**
   - Keep `VITE_FEATURE_PRODUCT_API_V2=false` by default in production.
   - Introduce a simple runtime override mechanism (e.g., admin toggle or query param) for internal sessions if desired.
   - Compare error rates and p95 latency between v1 vs v2 for:
     - `get-product`
     - `list-products`
     - `search-products`
3. **Stage 3 – 50% Traffic**
   - Switch production `VITE_FEATURE_PRODUCT_API_V2=true`.
   - Monitor:
     - HTTP 4xx/5xx rate for the three product endpoints.
     - Supabase log anomalies (slow queries, timeouts, constraint errors).
4. **Stage 4 – 100% and Legacy Decommission**
   - Once stable for at least 72 hours:
     - Treat edge functions as the **only** supported read path.
     - Plan removal of any remaining direct-read helpers that duplicate behavior already covered by `src/api/products.js`.

---

### 3. Rollback Strategy

Rollback is a simple flag flip:

- Set `VITE_FEATURE_PRODUCT_API_V2=false` and redeploy.
- The `src/api/products.js` module immediately routes reads back through:
  - `productService` (for detail/listing)
  - `searchService` (for search)

Use this if:

- Error rate for product endpoints exceeds acceptable thresholds.
- p95 latency regresses significantly relative to v1.
- DTO/schema changes accidentally break frontend assumptions.

---

### 4. Success Criteria

Consider `product_api_v2` fully rolled out when:

- All main product surfaces (Home, Shop, Product detail, Collections, Search, Wishlist, Admin Products) are proven to work with `env.productApiV2 === true`.
- No page or component imports `productService` or `searchService` directly for read-only product queries (they should all go through `src/api/products.js`).
- Edge function logs show stable error rates and latency for:
  - `get-product`
  - `list-products`
  - `search-products`

At that point, you can begin the final clean-up phase:

- Remove now-redundant read helpers from `productService` and `searchService` once no callers remain.
- Update `DATABASE_INTEGRATION_AUDIT.md` to reflect the v2 API as the canonical read path.

