import React from 'react';
import { cn } from '../../utils/cn';

const variants = {
  new: 'bg-charcoal text-white',
  sale: 'bg-[#8B4513] text-white',
  hot: 'bg-gold text-white',
  'best-seller': 'bg-dark-brown text-white',
  default: 'bg-neutral-200 text-text-primary',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-block text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded uppercase',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
