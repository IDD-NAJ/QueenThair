import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Stars from './Stars';
import Img from './Img';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const [activeColor, setActiveColor] = useState(0);
  const wishlisted = wishlist.includes(product.id);

  return (
    <div 
      className="bg-white rounded border border-border transition-all hover:shadow-lg hover:-translate-y-1 hover:border-border-dark cursor-pointer relative group fade-up"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative overflow-hidden aspect-[3/4] bg-neutral-100">
        <Img seed={product.id} className="absolute inset-0 transition-transform duration-600 group-hover:scale-105" />
        
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isNew && <span className="bg-charcoal text-white text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded">NEW</span>}
          {product.isSale && <span className="bg-[#8B4513] text-white text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded">SALE</span>}
          {product.isHot && <span className="bg-gold text-white text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded">HOT</span>}
        </div>

        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5 opacity-0 translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 z-10">
          <button 
            className={`w-[34px] h-[34px] bg-white rounded flex items-center justify-center shadow-md transition-all hover:bg-charcoal hover:text-white ${wishlisted ? 'text-[#c0392b]' : 'text-text-secondary'}`}
            onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
            title="Wishlist"
          >
            <Heart className="w-[15px] h-[15px]" strokeWidth={1.5} />
          </button>
          <button 
            className="w-[34px] h-[34px] bg-white rounded flex items-center justify-center shadow-md transition-all hover:bg-charcoal hover:text-white text-text-secondary"
            onClick={(e) => { e.stopPropagation(); }}
            title="Quick View"
          >
            <Eye className="w-[15px] h-[15px]" strokeWidth={1.5} />
          </button>
        </div>

        <button 
          className="absolute bottom-0 left-0 right-0 bg-charcoal text-white text-[11px] tracking-[0.1em] uppercase font-medium py-2.5 text-center translate-y-full transition-transform group-hover:translate-y-0"
          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
        >
          Add to Cart
        </button>
      </div>

      <div className="p-3.5 pb-4">
        <div className="text-[13px] font-normal text-text-primary mb-1.5 line-clamp-2 leading-snug">
          {product.name}
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          <Stars rating={parseFloat(product.rating)} />
          <span className="text-[11px] text-text-muted">({product.reviews})</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-semibold text-charcoal">${product.price}</span>
          {product.originalPrice && (
            <>
              <span className="text-[13px] text-text-muted line-through">${product.originalPrice}</span>
              <span className="text-[11px] text-[#8B4513] font-medium">Save ${product.originalPrice - product.price}</span>
            </>
          )}
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {product.colors.map((c, i) => (
            <div 
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-[1.5px] cursor-pointer transition-colors ${activeColor === i ? 'border-charcoal' : 'border-border'}`}
              style={{ background: c.hex }}
              onClick={(e) => { e.stopPropagation(); setActiveColor(i); }}
              title={c.key}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
