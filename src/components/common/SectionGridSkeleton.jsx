import React from 'react';

/**
 * Minimal loading placeholders for product/category grids (slow networks).
 * @param {'product'|'category'} variant
 */
export default function SectionGridSkeleton({ variant = 'product', count = 8, className = '' }) {
  const cell = variant === 'category' ? 'aspect-[4/5]' : 'aspect-[3/4]';
  const grid =
    variant === 'category'
      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6';
  return (
    <div
      className={`${grid} ${className}`}
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${cell} rounded-lg border border-border bg-neutral-100/90 animate-pulse motion-reduce:animate-none`}
        />
      ))}
    </div>
  );
}
