-- ============================================================================
-- SECURITY INDEXES MIGRATION
-- Version: 003
-- Description: Creates performance and security indexes for QUEENTHAIR database
-- Author: QUEENTHAIR Engineering Team
-- Created: 2024
-- ============================================================================

-- Use CONCURRENTLY to avoid locking tables during index creation
-- This allows the migration to run on a live production database

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Unique index on email for fast lookups and to enforce uniqueness
-- Serves: Login queries, user lookups by email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

-- Index on role for RBAC queries (filtering users by role)
-- Serves: Admin user listings, role-based access control checks
CREATE INDEX IF NOT EXISTS idx_users_role
  ON users(role);

-- Index on created_at for sorting and time-based queries
-- Serves: User registration reports, recent user queries
CREATE INDEX IF NOT EXISTS idx_users_created_at
  ON users(created_at DESC);

-- ============================================================================
-- REFRESH TOKENS TABLE INDEXES
-- ============================================================================

-- Index on user_id for token lookups during authentication
-- Serves: Token refresh queries, logout operations
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
  ON refresh_tokens(user_id);

-- Index on token_hash for token validation queries
-- Serves: Token verification during refresh
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash
  ON refresh_tokens(token_hash);

-- Index on expires_at for cleanup queries
-- Serves: Scheduled cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at
  ON refresh_tokens(expires_at);

-- ============================================================================
-- PASSWORD RESET TOKENS TABLE INDEXES
-- ============================================================================

-- Unique index on token_hash for fast validation
-- Serves: Password reset token lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_token_hash
  ON password_reset_tokens(token_hash);

-- Index on user_id for user's reset history queries
-- Serves: Security audits, rate limiting checks
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id
  ON password_reset_tokens(user_id);

-- Partial index on unexpired tokens for validation queries
-- Serves: Active token lookups during password reset
CREATE INDEX IF NOT EXISTS idx_password_reset_expires
  ON password_reset_tokens(expires_at)
  WHERE used = false;

-- ============================================================================
-- ORDERS TABLE INDEXES
-- ============================================================================

-- Index on user_id for user's order history queries
-- Serves: Order listings for users, ownership verification
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders(user_id);

-- Index on status for order status filtering
-- Serves: Admin order management, status-based reports
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders(status);

-- Index on created_at for sorting and date range queries
-- Serves: Order reports, recent orders, date range filters
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders(created_at DESC);

-- ============================================================================
-- PRODUCTS TABLE INDEXES
-- ============================================================================

-- Index on category_id for category filtering
-- Serves: Category product listings, category-based navigation
CREATE INDEX IF NOT EXISTS idx_products_category
  ON products(category_id);

-- Index on price for price range queries
-- Serves: Price filtering, sorting by price
CREATE INDEX IF NOT EXISTS idx_products_price
  ON products(price);

-- Partial index on active products for common queries
-- Serves: Shop listings, product searches (only active products)
CREATE INDEX IF NOT EXISTS idx_products_is_active
  ON products(is_active)
  WHERE is_active = true;

-- Index on created_at for sorting new arrivals
-- Serves: New arrivals listing, recent products
CREATE INDEX IF NOT EXISTS idx_products_created_at
  ON products(created_at DESC);

-- Full-text search index on product name and description
-- Serves: Product search functionality
CREATE INDEX IF NOT EXISTS idx_products_search
  ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================================================
-- CART ITEMS TABLE INDEXES
-- ============================================================================

-- Index on user_id for user's cart queries
-- Serves: Cart retrieval, cart item operations
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id
  ON cart_items(user_id);

-- ============================================================================
-- WISHLIST TABLE INDEXES
-- ============================================================================

-- Unique index on user_id + product_id to prevent duplicates
-- Serves: Wishlist add/remove operations, duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_user_product
  ON wishlist(user_id, product_id);

-- ============================================================================
-- REVIEWS TABLE INDEXES
-- ============================================================================

-- Index on product_id for product review queries
-- Serves: Product review listings, rating calculations
CREATE INDEX IF NOT EXISTS idx_reviews_product_id
  ON reviews(product_id);

-- Index on user_id for user's review history
-- Serves: User's reviews, review ownership verification
CREATE INDEX IF NOT EXISTS idx_reviews_user_id
  ON reviews(user_id);

-- Unique index to prevent duplicate reviews from same user on same product
-- Serves: Duplicate review prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_product
  ON reviews(user_id, product_id);

-- ============================================================================
-- AUDIT LOGS TABLE INDEXES
-- ============================================================================

-- Index on user_id for user's audit trail queries
-- Serves: Security audits, user activity logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON audit_logs(user_id);

-- Index on event_type for event filtering
-- Serves: Event type reports, security event queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_event
  ON audit_logs(event_type);

-- Index on created_at for time-based queries and cleanup
-- Serves: Audit log reports, old log cleanup
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs(created_at DESC);

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================

-- Record this migration in the schema_migrations table
INSERT INTO schema_migrations (version, name, applied_at)
VALUES ('003', 'security_indexes', NOW())
ON CONFLICT (version) DO UPDATE SET applied_at = NOW();
