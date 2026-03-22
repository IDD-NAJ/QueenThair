import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProductById } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/dashboard/LoadingState';
import useStore from '../store/useStore';

export default function WishlistPage() {
  const wishlist = useStore(state => state.wishlist);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlistItems() {
      if (wishlist.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const promises = wishlist.map(id => getProductById(id).catch(() => null));
        const products = await Promise.all(promises);
        setItems(products.filter(Boolean));
      } catch (error) {
        console.error('Failed to load wishlist items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    loadWishlistItems();
  }, [wishlist]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="bg-white border-b border-border">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'Wishlist' }]} />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            My Wishlist
          </h1>
          <p className="text-sm text-text-muted mt-2">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {items.length === 0 ? (
          <EmptyState
            icon="♡"
            title="Your wishlist is empty"
            description="Save items you love to your wishlist"
            action={{
              label: 'Browse Collection',
              href: '/shop',
              variant: 'secondary'
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {items.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button
                onClick={() => items.forEach(p => addToCart(p))}
                variant="secondary"
                size="lg"
              >
                Add All to Cart
              </Button>
              <Button
                onClick={() => items.forEach(p => toggleWishlist(p.id))}
                variant="outline"
                size="lg"
              >
                Clear All
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
