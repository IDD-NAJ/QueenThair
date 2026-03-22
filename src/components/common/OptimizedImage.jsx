import React, { useState } from 'react';
import { getFallbackImage } from '../../services/imageService';

/**
 * Optimized Image Component with lazy loading and fallback handling
 * Replaces the old Img component with gradient placeholders
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  fallbackType = 'default',
  aspectRatio = 'auto',
  loading = 'lazy',
  objectFit = 'cover',
  onLoad,
  onError,
  ...props
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleError = (e) => {
    setImageError(true);
    if (onError) onError(e);
  };

  const handleLoad = (e) => {
    setImageLoaded(true);
    if (onLoad) onLoad(e);
  };

  const imageSrc = imageError ? getFallbackImage(fallbackType) : src;

  // Aspect ratio classes
  const aspectRatioClasses = {
    'square': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '3/4': 'aspect-[3/4]',
    '16/9': 'aspect-video',
    '5/6': 'aspect-[5/6]',
    'auto': '',
  };

  const aspectClass = aspectRatioClasses[aspectRatio] || '';

  return (
    <div className={`relative overflow-hidden ${aspectClass} ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      )}
      <img
        src={imageSrc}
        alt={alt || 'Product image'}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        className={`w-full h-full object-${objectFit} transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
}

/**
 * Product Image Component - specialized for product cards
 */
export function ProductImage({ product, className = '', ...props }) {
  const imageUrl = product?.images?.[0]?.image_url || product?.image_url || product?.image;
  const altText = product?.images?.[0]?.alt_text || product?.alt_text || product?.name || 'Product';

  return (
    <OptimizedImage
      src={imageUrl}
      alt={altText}
      fallbackType={product?.product_type === 'accessory' ? 'accessory' : 'wig'}
      aspectRatio="5/6"
      className={className}
      {...props}
    />
  );
}

/**
 * Hero Image Component - for banners and hero sections
 */
export function HeroImage({ src, alt, className = '', ...props }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fallbackType="hero"
      aspectRatio="16/9"
      loading="eager"
      className={className}
      {...props}
    />
  );
}

/**
 * Category Image Component
 */
export function CategoryImage({ category, className = '', ...props }) {
  const imageUrl = category?.image_url || category?.image;
  const altText = category?.name || 'Category';

  return (
    <OptimizedImage
      src={imageUrl}
      alt={altText}
      fallbackType="default"
      aspectRatio="4/3"
      className={className}
      {...props}
    />
  );
}
