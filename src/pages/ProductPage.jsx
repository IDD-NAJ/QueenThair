import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, Heart, Truck, RefreshCw, Shield, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { getProduct, listProducts, searchProducts } from '../api/products';
import { getProductReviews, getRatingSummary } from '../services/reviewService';
import supabase from '../lib/supabaseClient';
import Img from '../components/common/Img';
import ProductCard from '../components/product/ProductCard';
import ReviewForm from '../components/product/ReviewForm';
import ReviewList from '../components/product/ReviewList';
import Stars from '../components/Stars';
import Button from '../components/common/Button';
import LoadingState from '../components/dashboard/LoadingState';
import { CURRENCY_SYMBOL } from '../constants';

export default function ProductPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const addToCart = useStore(state => state.addToCart);
  const toggleWishlist = useStore(state => state.toggleWishlist);
  const isInWishlist = useStore(state => state.isInWishlist);
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');

  // Fetch product data
  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id')
          .eq('slug', slug)
          .single();
        if (error || !data) throw error || new Error('Product not found');

        console.log('[ProductPage] Fetching product details for id:', data.id);
        const detail = await getProduct(data.id, { include: ['images', 'variants', 'inventory', 'category'] });
        console.log('[ProductPage] Product loaded:', detail?.name);
        console.log('[ProductPage] Images received:', detail?.images?.length, detail?.images);
        console.log('[ProductPage] Variants received:', detail?.variants?.length, detail?.variants);
        console.log('[ProductPage] Inventory received:', detail?.inventory);
        setProduct(detail);
        
        // Set default variant
        if (detail?.variants && detail.variants.length > 0) {
          setSelectedVariant(detail.variants[0]);
        }

        // Fetch related products
        if (detail?.category) {
          const { items } = await listProducts(
            { categorySlug: detail.category.slug },
            { page: 1, pageSize: 8 },
            { include: ['images', 'category'] }
          );
          setRelatedProducts(items.filter(p => p.id !== detail.id).slice(0, 4));
        }

        // Fetch reviews and rating summary
        loadReviews(data.id);
        loadRatingSummary(data.id);
      } catch (error) {
        console.error('Failed to load product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  // Load reviews
  const loadReviews = async (productId) => {
    setReviewsLoading(true);
    try {
      const { reviews: reviewsData } = await getProductReviews(productId, { limit: 20 });
      setReviews(reviewsData);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Load rating summary
  const loadRatingSummary = async (productId) => {
    try {
      const summary = await getRatingSummary(productId);
      setRatingSummary(summary);
    } catch (error) {
      console.error('Failed to load rating summary:', error);
    }
  };

  const handleReviewSubmitted = () => {
    if (product?.id) {
      loadReviews(product.id);
      loadRatingSummary(product.id);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="font-serif text-3xl text-charcoal mb-3">
              Product Not Found
            </h1>
            <p className="text-text-secondary mb-6">
              We couldn't find the product you're looking for. It may have been removed or the link is incorrect.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/shop')} variant="primary">
              Browse Shop
            </Button>
            <Button onClick={() => navigate('/')} variant="secondary">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const variants = product.variants || [];
  const wishlisted = isInWishlist(product.id, selectedVariant?.id);
  const currentPrice = selectedVariant?.price_override || product.base_price || 0;
  const comparePrice = product.compare_at_price;
  const inStock = product.inventory?.quantity_available > 0;

  const handleAddToCart = () => {
    const cartItem = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: currentPrice,
      image: images[0]?.image_url,
      variant: selectedVariant,
      color: selectedVariant?.color,
      length: selectedVariant?.length,
      density: selectedVariant?.density,
    };
    addToCart(cartItem, { qty });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Breadcrumb */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-charcoal to-dark-brown py-4 sm:py-5 px-4 sm:px-6 lg:px-10"
      >
        <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
          <span className="cursor-pointer hover:text-white" onClick={() => navigate('/')}>Home</span>
          <span className="text-neutral-300">›</span>
          <span className="cursor-pointer hover:text-white" onClick={() => navigate('/shop')}>Shop</span>
          <span className="text-neutral-300">›</span>
          <span className="text-neutral-300 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{product.name}</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6 sm:gap-8 lg:gap-12 items-start max-w-[1200px] mx-auto py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-10"
      >
        {/* GALLERY */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="lg:sticky lg:top-[88px]"
        >
          {/* Main Image with Zoom Effect */}
          <motion.div 
            className="aspect-[3/4] bg-neutral-100 rounded overflow-hidden mb-2.5 cursor-zoom-in group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4 }}
          >
            {images.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImg}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full h-full"
                >
                  <motion.div 
                    className="w-full h-full"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <Img 
                      src={images[activeImg]?.image_url}
                      alt={images[activeImg]?.alt_text || product.name}
                      loading="eager"
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                No image available
              </div>
            )}
          </motion.div>

          {/* Thumbnails with Stagger Animation */}
          {images.length > 1 && (
            <motion.div 
              className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
            >
              {images.map((img, i) => (
                <motion.div 
                  key={img.id || i}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square bg-neutral-100 rounded overflow-hidden border-2 cursor-pointer transition-all duration-300 ${activeImg === i ? 'border-gold shadow-md' : 'border-transparent hover:border-gold'}`}
                >
                  <motion.div
                    animate={{ 
                      opacity: activeImg === i ? 1 : 0.7,
                      scale: activeImg === i ? 1 : 0.95
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                  >
                    <Img 
                      src={img.image_url}
                      alt={img.alt_text || `${product.name} - view ${i + 1}`}
                      loading="lazy"
                    />
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* INFO */}
        <div>
          <div className="text-[10px] sm:text-[11px] tracking-[0.1em] uppercase text-gold mb-2">QUEENTHAIR Premium</div>
          <h1 className="font-serif text-2xl sm:text-[28px] lg:text-[30px] font-normal text-charcoal leading-tight mb-3">{product.name}</h1>
          
          {product.rating_average > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-4 sm:mb-5">
              <Stars rating={product.rating_average} size={13} />
              <span className="text-xs text-text-muted">({product.review_count} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2.5 mb-5 sm:mb-6">
            <div className="text-2xl sm:text-[26px] font-normal text-charcoal">
              {CURRENCY_SYMBOL}{currentPrice.toFixed(2)}
            </div>
            {comparePrice && comparePrice > currentPrice && (
              <div className="text-base text-text-muted line-through">
                {CURRENCY_SYMBOL}{comparePrice.toFixed(2)}
              </div>
            )}
          </div>

          {/* Short Description */}
          {product.short_description && (
            <p className="text-sm text-text-secondary mb-5 sm:mb-6 leading-relaxed">
              {product.short_description}
            </p>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <div className="space-y-4 mb-6">
              {/* Color Selection */}
              {variants.some(v => v.color) && (
                <div>
                  <div className="text-xs tracking-wider uppercase font-semibold text-charcoal mb-2.5">
                    Color: {selectedVariant?.color || 'Select'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(variants.map(v => v.color))].filter(Boolean).map(color => {
                      const variant = variants.find(v => v.color === color);
                      const isSelected = selectedVariant?.color === color;
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-4 py-2 border-2 rounded text-sm transition-all ${
                            isSelected ? 'border-charcoal bg-charcoal text-white' : 'border-border hover:border-charcoal'
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Length Selection */}
              {variants.some(v => v.length) && (
                <div>
                  <div className="text-xs tracking-wider uppercase font-semibold text-charcoal mb-2.5">
                    Length: {selectedVariant?.length || 'Select'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(variants.map(v => v.length))].filter(Boolean).map(length => {
                      const variant = variants.find(v => v.length === length && (!selectedVariant?.color || v.color === selectedVariant.color));
                      const isSelected = selectedVariant?.length === length;
                      return (
                        <button
                          key={length}
                          onClick={() => variant && setSelectedVariant(variant)}
                          className={`px-4 py-2 border-2 rounded text-sm transition-all ${
                            isSelected ? 'border-charcoal bg-charcoal text-white' : 'border-border hover:border-charcoal'
                          }`}
                        >
                          {length}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Density Selection */}
              {variants.some(v => v.density) && (
                <div>
                  <div className="text-xs tracking-wider uppercase font-semibold text-charcoal mb-2.5">
                    Density: {selectedVariant?.density || 'Select'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(variants.map(v => v.density))].filter(Boolean).map(density => {
                      const variant = variants.find(v => v.density === density);
                      const isSelected = selectedVariant?.density === density;
                      return (
                        <button
                          key={density}
                          onClick={() => variant && setSelectedVariant(variant)}
                          className={`px-4 py-2 border-2 rounded text-sm transition-all ${
                            isSelected ? 'border-charcoal bg-charcoal text-white' : 'border-border hover:border-charcoal'
                          }`}
                        >
                          {density}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="mb-5 sm:mb-6">
            <div className="text-xs tracking-wider uppercase font-semibold text-charcoal mb-2.5">Quantity</div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-9 h-9 border border-border rounded flex items-center justify-center text-lg hover:bg-neutral-100 transition-colors"
              >
                −
              </button>
              <span className="text-base font-medium min-w-[30px] text-center">{qty}</span>
              <button 
                onClick={() => setQty(qty + 1)}
                className="w-9 h-9 border border-border rounded flex items-center justify-center text-lg hover:bg-neutral-100 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-6 sm:mb-8">
            <Button 
              onClick={handleAddToCart}
              disabled={!inStock}
              fullWidth
              className="flex-1"
            >
              <ShoppingBag className="w-4 h-4" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
            <button
              onClick={() => toggleWishlist(product.id, selectedVariant?.id)}
              className={`w-12 h-12 border-2 rounded flex items-center justify-center transition-all ${
                wishlisted ? 'border-gold bg-gold text-white' : 'border-border hover:border-gold'
              }`}
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-border">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <Truck className="w-5 h-5 text-gold flex-shrink-0" />
              <span>Free shipping on orders over $100</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <RefreshCw className="w-5 h-5 text-gold flex-shrink-0" />
              <span>30-day return policy</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <Shield className="w-5 h-5 text-gold flex-shrink-0" />
              <span>100% authentic human hair</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border mb-5">
            <div className="flex gap-6">
              {['description', 'care', 'shipping', 'reviews'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-3 text-sm font-medium capitalize transition-colors relative ${
                    tab === t ? 'text-charcoal' : 'text-text-muted hover:text-charcoal'
                  }`}
                >
                  {t === 'reviews' ? `Reviews (${reviews.length})` : t}
                  {tab === t && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="text-sm text-text-secondary leading-relaxed">
            {tab === 'description' && (
              <div dangerouslySetInnerHTML={{ __html: product.description || 'No description available.' }} />
            )}
            {tab === 'care' && (
              <div>
                <p className="mb-3">To maintain the quality and longevity of your wig:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Wash with sulfate-free shampoo</li>
                  <li>Condition regularly</li>
                  <li>Air dry on a wig stand</li>
                  <li>Store in a cool, dry place</li>
                  <li>Avoid excessive heat styling</li>
                </ul>
              </div>
            )}
            {tab === 'shipping' && (
              <div>
                <p className="mb-3">Shipping Information:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Free shipping on orders over $100</li>
                  <li>Standard shipping: 5-7 business days</li>
                  <li>Express shipping: 2-3 business days</li>
                  <li>International shipping available</li>
                </ul>
              </div>
            )}
            {tab === 'reviews' && (
              <div className="space-y-6">
                {/* Rating Summary */}
                {ratingSummary && ratingSummary.count > 0 && (
                  <div className="bg-neutral-50 border border-border rounded-lg p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-charcoal mb-1">
                          {ratingSummary.average}
                        </div>
                        <Stars rating={ratingSummary.average} size="sm" />
                        <div className="text-xs text-text-muted mt-1">
                          {ratingSummary.count} {ratingSummary.count === 1 ? 'review' : 'reviews'}
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-text-muted w-8">{star} star</span>
                            <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gold"
                                style={{
                                  width: `${ratingSummary.count > 0 ? ((ratingSummary.distribution[star] || 0) / ratingSummary.count) * 100 : 0}%`
                                }}
                              />
                            </div>
                            <span className="text-xs text-text-muted w-8 text-right">
                              {ratingSummary.distribution[star] || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Review Form */}
                <ReviewForm productId={product.id} onReviewSubmitted={handleReviewSubmitted} />

                {/* Reviews List */}
                <div>
                  <h3 className="text-lg font-semibold text-charcoal mb-4">Customer Reviews</h3>
                  <ReviewList reviews={reviews} loading={reviewsLoading} />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-warm-white py-12 sm:py-16"
        >
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
            <h2 className="font-serif text-2xl sm:text-3xl text-charcoal mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {relatedProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
