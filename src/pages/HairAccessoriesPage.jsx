import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { getProducts } from '../services/productService';
import { getCategories } from '../services/categoryService';
import ProductCard from '../components/product/ProductCard';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/dashboard/LoadingState';
import { PRODUCT_SORT_OPTIONS } from '../constants';

export default function HairAccessoriesPage() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const sortBy = searchParams.get('sort') || 'featured';
  const priceRange = searchParams.get('price') || '';

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getCategories();
        // Filter to only accessory categories
        const accessoryCategories = (cats || []).filter(c => 
          ['bonnets', 'combs', 'caps', 'styling', 'adhesives', 'storage', 'clips'].includes(c.slug)
        );
        setCategories(accessoryCategories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    }
    loadCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const filters = {
          productType: 'accessory',
          categorySlug: category || undefined,
          sortBy: sortBy,
          limit: 100,
        };

        // Add price range filter
        if (priceRange) {
          const [min, max] = priceRange.split('-').map(Number);
          filters.minPrice = min;
          if (max) filters.maxPrice = max;
        }

        const result = await getProducts(filters);
        setProducts(result.products || []);
      } catch (error) {
        console.error('Failed to load accessories:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [category, sortBy, priceRange]);

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const activeFiltersCount = [priceRange].filter(Boolean).length;

  const currentCategory = categories.find(c => c.slug === category);
  const breadcrumbItems = [
    { label: 'Hair Accessories', href: '/hair-accessories' }
  ];

  if (currentCategory) {
    breadcrumbItems.push({ label: currentCategory.name });
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            {currentCategory?.name || 'Hair Accessories'}
          </h1>
          <p className="text-sm text-text-muted mt-2 max-w-2xl">
            {currentCategory?.description || 'Essential accessories for your hair care routine'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white border border-border rounded p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs tracking-wider uppercase font-semibold text-charcoal">
                  Filters
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="text-xs text-gold">
                    {activeFiltersCount} active
                  </span>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <div className="text-xs tracking-wider uppercase font-semibold text-charcoal mb-3">
                  Category
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => window.location.href = '/hair-accessories'}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      !category ? 'bg-neutral-100 text-charcoal' : 'text-text-secondary hover:bg-neutral-50'
                    }`}
                  >
                    All Accessories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => window.location.href = `/hair-accessories/${cat.slug}`}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        category === cat.slug ? 'bg-neutral-100 text-charcoal' : 'text-text-secondary hover:bg-neutral-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <div className="text-xs tracking-wider uppercase font-semibold text-charcoal mb-3">
                  Price Range
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'All Prices', value: '' },
                    { label: 'Under $20', value: '0-20' },
                    { label: '$20 - $40', value: '20-40' },
                    { label: '$40 - $60', value: '40-60' },
                    { label: 'Over $60', value: '60' },
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        checked={priceRange === option.value}
                        onChange={() => handleFilterChange('price', option.value)}
                        className="w-4 h-4 text-gold focus:ring-gold"
                      />
                      <span className="text-sm text-text-secondary">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  fullWidth
                  size="sm"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="text-sm text-text-muted">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-border rounded text-sm text-text-secondary hover:bg-neutral-100 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="bg-gold text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="px-4 py-2 border border-border rounded text-sm text-text-secondary bg-white outline-none focus:border-gold transition-colors"
                >
                  {PRODUCT_SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {products.map((product, idx) => (
                  <ProductCard key={product.id} product={product} index={idx} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🔍"
                title="No accessories found"
                description="Try adjusting your filters or browse all accessories"
                action={{
                  label: 'View All Accessories',
                  href: '/hair-accessories',
                  variant: 'secondary'
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
