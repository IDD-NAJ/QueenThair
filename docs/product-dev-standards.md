### Product Development Standards

These standards codify how product-related backend and frontend code should be implemented going forward.

---

### 1. Backend / Edge Functions

- **Repository and mappers**
  - All product read logic must go through the shared repository and mapper layer:
    - `supabase/functions/_shared/productRepository.ts`
    - `supabase/functions/_shared/productMappers.ts`
  - Do not write raw SQL or ad-hoc JSON construction inside individual edge functions.
- **Canonical DTOs and envelopes**
  - Edge functions must return the canonical envelope:
    - `{ data: T | T[], meta: { total?: number; page?: number; pageSize?: number }, error: { code: string; message: string } | null }`
  - DTO shapes (`ProductListItemDTO`, `ProductDetailDTO`, `ProductAdminDTO`) must stay in sync with:
    - `src/domain/product-dtos.js`
    - `docs/api-contracts-canonical.md`
- **Visibility and consistency**
  - All public product endpoints must consistently enforce visibility rules (e.g., `is_active = true`, inventory constraints) via shared helpers in the repository layer.

---

### 2. Frontend Integration

- **Single product API client**
  - All React code that reads product data must call through:
    - `src/api/products.js`
  - Do not fetch from Supabase directly in components for product reads; keep Supabase usage encapsulated in:
    - `src/api/products.js` (v2 edge function client)
    - or the legacy services behind the feature flag, not directly in pages/components.
- **Shared types/models**
  - Frontend product shapes (`ProductListItem`, `ProductDetail`, etc.) are defined in:
    - `src/types/product.js`
  - Components must use these shapes consistently; if new fields are required:
    - Update the DTOs
    - Update `src/types/product.js`
    - Update `docs/api-contracts-canonical.md` with the mapping.

---

### 3. Feature Flags and Rollout

- **product_api_v2 flag**
  - Frontend env variable:
    - `VITE_FEATURE_PRODUCT_API_V2`
  - Consumed via:
    - `env.productApiV2` in `src/lib/env.js`
    - Used inside `src/api/products.js` to route between:
      - v2 edge functions (`get-product`, `list-products`, `search-products`)
      - legacy direct Supabase services (`productService`, `searchService`)
- **Rollout and rollback**
  - Follow the staged rollout and rollback guidance in `docs/rollout-products.md`.
  - New work should assume v2 is the long-term target and keep v1 compatibility only as needed during rollout.

---

### 4. Testing Expectations

- **Backend/edge tests**
  - Add or update tests that cover:
    - `productRepository` behavior (filters, pagination, visibility rules).
    - Mapping correctness in `entityToDomain` and `domainToDTO`.
    - Envelope shape for each edge function.
- **Frontend tests**
  - For product APIs, write tests against `src/api/products.js` rather than against pages:
    - Validate envelope handling
    - Validate error propagation via `ApiError`
    - Verify that the feature flag correctly switches between v1 and v2 implementations.

---

### 5. CI / PR Guardrails

- Any PR that touches one of the following must:
  - `supabase/migrations/`
  - `supabase/functions/`
  - `src/domain/`
  - `src/api/products.js`

Should also:

- Update:
  - `docs/schema-products.md`
  - `docs/er-products.md`
  - `docs/api-contracts-canonical.md`
- Run:
  - Lint: `npm run lint`
  - Product tests (once introduced): e.g., `npm run test:products`

Enforcing these checks in CI ensures the product system stays consistent and schema-aligned as it evolves.

