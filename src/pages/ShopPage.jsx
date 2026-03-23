import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { listProducts } from '../api/products';
import { getCategories } from '../services/categoryService';
import { PRODUCT_SORT_OPTIONS, ITEMS_PER_PAGE } from '../constants';
import ProductCard from '../components/product/ProductCard';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/dashboard/LoadingState';
import Drawer from '../components/common/Drawer';
import { useIsMobile } from '../hooks/useMediaQuery';

const COLORS = [
  { key: 'natural-black', name: 'Natural Black', hex: '#1A1A1A' },
  { key: 'dark-brown', name: 'Dark Brown', hex: '#5C3A1E' },
  { key: 'honey-blonde', name: 'Honey Blonde', hex: '#E8C97A' },
  { key: 'platinum-blonde', name: 'Platinum Blonde', hex: '#F5E6D3' },
  { key: 'auburn', name: 'Auburn', hex: '#922B21' },
  { key: 'burgundy', name: 'Burgundy', hex: '#800020' },
  { key: 'ash-gray', name: 'Ash Gray', hex: '#9E9E9E' },
  { key: 'caramel', name: 'Caramel', hex: '#C19A6B' },
];

const TEXTURES = ['straight', 'body-wave', 'deep-wave', 'curly', 'kinky-curly', 'water-wave'];

export default function ShopPage() {
  const { category: categorySlug } = useParams();
  const isMobile = useIsMobile();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedTextures, setSelectedTextures] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getCategories();
        setCategories(cats || []);
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
          productType: 'wig',
          categorySlug: categorySlug || undefined,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          sortBy: sortBy,
        };

        const result = await listProducts(filters, { page: 1, pageSize: 200 }, { include: ['images', 'category', 'variants'] });
        let fetchedProducts = result.items || [];

        // Client-side filtering for colors and textures
        if (selectedColors.length > 0) {
          fetchedProducts = fetchedProducts.filter(p => 
            p.variants?.some(v => selectedColors.includes(v.color?.toLowerCase().replace(/\s+/g, '-')))
          );
        }

        if (selectedTextures.length > 0) {
          fetchedProducts = fetchedProducts.filter(p => 
            selectedTextures.includes(p.short_description?.toLowerCase().split(' ')[1]) ||
            selectedTextures.some(t => p.name?.toLowerCase().includes(t))
          );
        }

        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [categorySlug, priceRange, sortBy, selectedColors, selectedTextures]);

  // Find current category
  useEffect(() => {
    if (categorySlug && categories.length > 0) {
      const cat = categories.find(c => c.slug === categorySlug);
      setCurrentCategory(cat || null);
    } else {
      setCurrentCategory(null);
    }
  }, [categorySlug, categories]);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeFiltersCount = selectedColors.length + selectedTextures.length;

  const clearAllFilters = () => {
    setSelectedColors([]);
    setSelectedTextures([]);
    setPriceRange([0, 500]);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <div className="text-xs tracking-wider uppercase font-semibold text-charcoal mb-3">
          Price Range
        </div>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="500"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div>
        <div className="text-xs tracking-wider uppercase font-semibold text-charcoal mb-3">
          Color
        </div>
        <div className="grid grid-cols-4 gap-2">
          {COLORS.map((color) => (
            <button
              key={color.key}
              onClick={() => setSelectedColors(prev =>
                prev.includes(color.key) ? prev.filter(c => c !== color.key) : [...prev, color.key]
              )}
              className={`w-10 h-10 rounded border-2 transition-all ${
                selectedColors.includes(color.key) ? 'border-charcoal scale-110' : 'border-border hover:border-charcoal'
              }`}
              style={{ background: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Texture */}
      <div>
        <div className="text-xs tracking-wider uppercase font-semibold text-charcoal mb-3">
          Texture
        </div>
        <div className="space-y-1.5">
          {TEXTURES.map(texture => (
            <label key={texture} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTextures.includes(texture)}
                onChange={(e) => setSelectedTextures(prev =>
                  e.target.checked ? [...prev, texture] : prev.filter(t => t !== texture)
                )}
                className="w-4 h-4 rounded border-border text-gold focus:ring-gold"
              />
              <span className="text-sm text-text-secondary capitalize">
                {texture.split('-').join(' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button
          onClick={clearAllFilters}
          variant="outline"
          fullWidth
          size="sm"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  if (loading) {
    return <LoadingState />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-warm-white"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-border"
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs
            items={[
              { label: 'Shop', href: '/shop' },
              ...(currentCategory ? [{ label: currentCategory.name }] : [])
            ]}
          />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            {currentCategory?.name || 'All Products'}
          </h1>
          {currentCategory?.description && (
            <p className="text-sm text-text-muted mt-2 max-w-2xl">
              {currentCategory.description}
            </p>
          )}
        </div>
      </motion.div>

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
              <FilterContent />
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
                  onClick={() => setFiltersOpen(true)}
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
                  onChange={(e) => setSortBy(e.target.value)}
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

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <span className="text-xs text-text-muted">Active filters:</span>
                {selectedColors.map(colorKey => {
                  const color = COLORS.find(c => c.key === colorKey);
                  return (
                    <button
                      key={colorKey}
                      onClick={() => setSelectedColors(prev => prev.filter(c => c !== colorKey))}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 rounded text-xs text-text-secondary hover:bg-neutral-200 transition-colors"
                    >
                      {color?.name}
                      <X className="w-3 h-3" />
                    </button>
                  );
                })}
                {selectedTextures.map(texture => (
                  <button
                    key={texture}
                    onClick={() => setSelectedTextures(prev => prev.filter(t => t !== texture))}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 rounded text-xs text-text-secondary hover:bg-neutral-200 transition-colors"
                  >
                    {texture.split('-').join(' ')}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            {/* Product Grid */}
            {paginatedProducts.length > 0 ? (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
                >
                  {paginatedProducts.map((product, idx) => (
                    <ProductCard key={product.id} product={product} index={idx} />
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-border rounded text-sm text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-charcoal text-white'
                            : 'border border-border text-text-secondary hover:bg-neutral-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-border rounded text-sm text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon="🔍"
                title="No products found"
                description="Try adjusting your filters or search criteria"
                action={{
                  label: 'Clear Filters',
                  onClick: clearAllFilters,
                  variant: 'secondary'
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <Drawer
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        position="left"
        size="sm"
      >
        <div className="p-6">
          <FilterContent />
        </div>
      </Drawer>
    </motion.div>
  );
}
