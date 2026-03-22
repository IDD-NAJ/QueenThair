import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProducts } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import Breadcrumbs from '../components/common/Breadcrumbs';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/dashboard/LoadingState';
import { analytics } from '../utils/analytics';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function searchProducts() {
      if (query) {
        setLoading(true);
        try {
          const result = await getProducts({ search: query, limit: 50 });
          setResults(result.data || []);
          analytics.search(query);
        } catch (error) {
          console.error('Search failed:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }
    searchProducts();
  }, [query]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="bg-white border-b border-border">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'Search Results' }]} />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            Search Results
          </h1>
          <p className="text-sm text-text-muted mt-2">
            {query ? `Showing results for "${query}"` : 'Enter a search query'}
          </p>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {results.length > 0 ? (
          <>
            <div className="text-sm text-text-muted mb-6">
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {results.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : query ? (
          <EmptyState
            icon="🔍"
            title="No results found"
            description={`We couldn't find any products matching "${query}"`}
            action={{
              label: 'Browse All Products',
              href: '/shop',
              variant: 'secondary'
            }}
          />
        ) : (
          <EmptyState
            icon="🔍"
            title="Start searching"
            description="Enter a search term to find products"
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
