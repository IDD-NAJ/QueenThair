import React, { useState } from 'react';
import { Image } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Image component with loading states, error handling, and fallback support
 * 
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} className - Additional CSS classes
 * @param {string} loading - Loading strategy ('lazy' | 'eager')
 * @param {number} seed - DEPRECATED: Legacy placeholder seed (for backward compatibility)
 */
export default function Img({ 
  src, 
  alt = 'Product image', 
  className = '', 
  loading = 'lazy',
  seed // Deprecated but kept for backward compatibility
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // If no src provided or error occurred, show fallback
  if (error || !src) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center w-full h-full bg-neutral-100',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <Image className="w-8 h-8 text-neutral-300" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Loading placeholder */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <Image className="w-8 h-8 text-neutral-300 animate-pulse" strokeWidth={1.5} />
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
