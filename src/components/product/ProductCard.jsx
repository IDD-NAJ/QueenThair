import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import useStore from '../../store/useStore';
import Badge from '../common/Badge';
import Img from '../common/Img';
import { CURRENCY_SYMBOL } from '../../constants';

export default function ProductCard({ product, index = 0 }) {
  const [activeColor, setActiveColor] = useState(0);
  const addToCart = useStore(state => state.addToCart);
  const toggleWishlist = useStore(state => state.toggleWishlist);
  const isInWishlist = useStore(state => state.isInWishlist);
  const wishlisted = isInWishlist(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link 
        to={`/product/${product.slug}`}
        className="group block bg-white rounded border border-border transition-all hover:shadow-lg hover:-translate-y-1 hover:border-border-dark"
      >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-neutral-100 rounded-t">
        <Img 
          src={product.images?.[0]?.url || product.image}
          alt={product.images?.[0]?.alt || product.name}
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" 
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.badges.isNew && <Badge variant="new">NEW</Badge>}
          {product.badges.isSale && <Badge variant="sale">SALE</Badge>}
          {product.badges.isHot && <Badge variant="hot">HOT</Badge>}
          {product.badges.isBestSeller && <Badge variant="best-seller">BEST</Badge>}
        </div>

        {/* Quick Actions */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5 opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 z-10">
          <button 
            onClick={handleToggleWishlist}
            className={`w-[34px] h-[34px] bg-white rounded flex items-center justify-center shadow-md transition-all hover:bg-charcoal hover:text-white ${wishlisted ? 'text-red-500' : 'text-text-secondary'}`}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className="w-[15px] h-[15px]" strokeWidth={1.5} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          <button 
            className="w-[34px] h-[34px] bg-white rounded flex items-center justify-center shadow-md transition-all hover:bg-charcoal hover:text-white text-text-secondary"
            aria-label="Quick view"
          >
            <Eye className="w-[15px] h-[15px]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Add to Cart Button */}
        <button 
          onClick={handleAddToCart}
          className="absolute bottom-0 left-0 right-0 bg-charcoal text-white text-xs tracking-wider uppercase font-medium py-2.5 text-center translate-y-full transition-transform duration-300 group-hover:translate-y-0 flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
          Add to Cart
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5 pb-4">
        <div className="text-sm font-normal text-text-primary mb-1.5 line-clamp-2 leading-snug min-h-[2.6rem]">
          {product.name}
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex gap-0.5 text-[11px]">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={i < Math.floor(parseFloat(product.rating)) ? 'text-gold' : 'text-neutral-300'}>
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-text-muted">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-base font-semibold text-charcoal">
            {CURRENCY_SYMBOL}{product.price}
          </span>
          {product.compareAtPrice && (
            <>
              <span className="text-sm text-text-muted line-through">
                {CURRENCY_SYMBOL}{product.compareAtPrice}
              </span>
              <span className="text-xs text-[#8B4513] font-medium">
                Save {CURRENCY_SYMBOL}{product.compareAtPrice - product.price}
              </span>
            </>
          )}
        </div>

        {/* Colors - Only for wigs */}
        {product.variants?.colors && product.variants.colors.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-xs text-text-muted">
              {product.variants.colors.length} {product.variants.colors.length === 1 ? 'color' : 'colors'}
            </span>
          </div>
        )}
        
        {/* Short Description - For accessories */}
        {product.shortDescription && !product.variants?.colors && (
          <p className="text-xs text-text-muted mb-2 line-clamp-2">{product.shortDescription}</p>
        )}
      </div>
    </Link>
    </motion.div>
  );
}
