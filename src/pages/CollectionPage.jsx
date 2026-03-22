import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProducts } from '../services/productService';
import { getCollections } from '../services/collectionService';
import ProductCard from '../components/product/ProductCard';
import Breadcrumbs from '../components/common/Breadcrumbs';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/dashboard/LoadingState';

export default function CollectionPage() {
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollection() {
      setLoading(true);
      try {
        const collections = await getCollections();
        const found = collections.find(c => c.slug === slug);
        setCollection(found || null);

        if (found) {
          // Map collection slug to product filter
          const filters = { limit: 50 };
          
          if (slug === 'new-arrivals') {
            filters.newArrival = true;
          } else if (slug === 'best-sellers') {
            filters.bestSeller = true;
          } else if (slug === 'sale') {
            filters.onSale = true;
          } else if (slug === 'accessories') {
            filters.productType = 'accessory';
          } else {
            // For other collections, fetch products associated with this collection
            filters.collectionId = found.id;
          }

          const result = await getProducts(filters);
          setProducts(result.products || []);
        }
      } catch (error) {
        console.error('Failed to load collection:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCollection();
  }, [slug]);

  if (loading) {
    return <LoadingState />;
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <EmptyState
          icon="📦"
          title="Collection not found"
          description="The collection you're looking for doesn't exist"
          action={{
            label: 'Browse All Products',
            href: '/shop',
            variant: 'secondary'
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs
            items={[
              { label: 'Collections', href: '/shop' },
              { label: collection.name }
            ]}
          />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            {collection.name}
          </h1>
          <p className="text-sm text-text-muted mt-2 max-w-2xl">
            {collection.description}
          </p>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {products.length > 0 ? (
          <>
            <div className="text-sm text-text-muted mb-6">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon="📦"
            title="No products in this collection"
            description="Check back soon for new additions"
            action={{
              label: 'Browse All Products',
              href: '/shop',
              variant: 'secondary'
            }}
          />
        )}
      </div>
    </div>
  );
}
