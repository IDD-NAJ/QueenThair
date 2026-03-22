# QUEENTHAIR – Backend Setup Guide

## Prerequisites
- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- A Supabase project (free at [supabase.com](https://supabase.com))
- A Stripe account (free at [stripe.com](https://stripe.com))
- A Resend account (free at [resend.com](https://resend.com))

---

## 1. Environment Variables

```bash
cp .env.example .env
```

Fill in all values in `.env`:

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (secret) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks (after creating endpoint) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |

---

## 2. Install Frontend Dependencies

```bash
npm install
```

This installs `@supabase/supabase-js` and `@stripe/stripe-js` added to `package.json`.

---

## 3. Run Database Migrations

### Option A: Supabase Cloud (recommended)
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Option B: Manual SQL
Paste each migration file in order into the Supabase SQL editor:
1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/migrations/003_auth_trigger.sql`
4. `supabase/migrations/004_storage.sql`
5. `supabase/migrations/005_inventory_rpc.sql`

---

## 4. Seed the Database

```bash
node supabase/seed/seed.js
```

This populates:
- 6 wig categories + 11 accessory categories
- 4 collections (new-arrivals, best-sellers, sale, accessories)
- 40 wig products with variants and inventory
- 51 accessory products with inventory
- Collection memberships

---

## 5. Deploy Edge Functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy send-email
```

Set Edge Function secrets:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set DEFAULT_FROM_EMAIL="QUEENTHAIR <hello@Queenthair.com>"
supabase secrets set SUPPORT_EMAIL=support@Queenthair.com
supabase secrets set SITE_URL=https://your-domain.com
```

---

## 6. Configure Stripe Webhook

In Stripe Dashboard → Webhooks, create an endpoint:
- **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
- **Events to listen for**:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

Copy the webhook signing secret and set it as `STRIPE_WEBHOOK_SECRET`.

---

## 7. Configure Supabase Auth

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: Add `https://your-domain.com/reset-password`

---

## 8. Run Locally

```bash
npm run dev
```

The frontend is now connected to the real Supabase backend.

---

## Architecture Overview

```
Frontend (React + Vite)
  └─ src/lib/           # Supabase client, Stripe loader, env config, error utils
  └─ src/services/      # Service layer (one file per domain)
  └─ src/hooks/         # useAuth (global auth init + helpers)
  └─ src/store/         # Zustand store (cart, wishlist, auth state)

Supabase
  └─ supabase/migrations/   # SQL schema, RLS, triggers, storage
  └─ supabase/seed/         # Database seed from mock data
  └─ supabase/functions/    # Deno Edge Functions
       ├─ create-checkout-session/   # Creates Stripe PaymentIntent + pending order
       ├─ stripe-webhook/            # Handles payment_intent.succeeded / .failed
       └─ send-email/                # Resend transactional email dispatcher
```

## Service Layer Reference

| File | Purpose |
|---|---|
| `authService.js` | Sign up, sign in, sign out, session, password reset |
| `profileService.js` | Read/update profile, avatar upload |
| `addressService.js` | CRUD addresses, set default |
| `categoryService.js` | Fetch categories |
| `collectionService.js` | Fetch collections + products |
| `productService.js` | Query products with filters, related products, inventory check |
| `cartService.js` | Guest + auth cart, add/update/remove, merge on login, validate for checkout |
| `wishlistService.js` | Add/remove/toggle wishlist items |
| `orderService.js` | User order history, guest lookup, timeline, promo validation |
| `reviewService.js` | Fetch/submit/approve reviews, rating summary |
| `newsletterService.js` | Subscribe/unsubscribe |
| `contactService.js` | Submit contact messages |
| `searchService.js` | Full-text search, autocomplete |

## Connecting Remaining Pages

Each page should import from `src/services/` instead of `src/data/`:

```js
// Before (mock)
import { PRODUCTS } from '../data/products';

// After (real)
import { getProducts, getProductBySlug } from '../services/productService';
```

The `src/data/products.js` and `src/data/accessories.js` files can remain as 
fallback/reference during transition but should not be used as the primary data source.
