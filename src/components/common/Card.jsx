import React from 'react';
import { cn } from '../../utils/cn';

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded border border-border',
        hover && 'transition-all hover:shadow-lg hover:-translate-y-1 hover:border-border-dark',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
