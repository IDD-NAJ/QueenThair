// Canonical enum-like constants for the product domain.
// Keep these aligned with DB enums in `supabase/migrations/001_schema.sql`.

export const ProductType = Object.freeze({
  Wig: 'wig',
  Accessory: 'accessory',
});

export const CartStatus = Object.freeze({
  Active: 'active',
  Converted: 'converted',
  Abandoned: 'abandoned',
});

export const OrderStatus = Object.freeze({
  Pending: 'pending',
  Paid: 'paid',
  Processing: 'processing',
  Shipped: 'shipped',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
  Refunded: 'refunded',
});

export const PaymentStatus = Object.freeze({
  Pending: 'pending',
  Paid: 'paid',
  Failed: 'failed',
  Refunded: 'refunded',
  PartiallyRefunded: 'partially_refunded',
});

export const FulfillmentStatus = Object.freeze({
  Unfulfilled: 'unfulfilled',
  Partial: 'partial',
  Fulfilled: 'fulfilled',
  Returned: 'returned',
});

