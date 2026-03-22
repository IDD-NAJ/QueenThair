import React from 'react';

export default function Stars({ rating, size = 11 }) {
  const full = Math.floor(rating);
  
  return (
    <div className="flex gap-0.5" style={{ fontSize: `${size}px` }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < full ? 'text-gold' : 'text-neutral-300'}>
          ★
        </span>
      ))}
    </div>
  );
}
