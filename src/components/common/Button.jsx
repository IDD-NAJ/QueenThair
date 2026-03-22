import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-charcoal text-white hover:bg-dark-brown',
  secondary: 'bg-gold text-white hover:bg-gold-light',
  outline: 'border border-border text-text-secondary hover:border-charcoal hover:text-charcoal bg-transparent',
  ghost: 'text-text-secondary hover:bg-neutral-100 hover:text-charcoal',
  link: 'text-gold hover:text-gold-light underline-offset-4 hover:underline',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-sm',
  xl: 'px-10 py-4 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  href,
  to,
  disabled,
  loading,
  fullWidth,
  icon,
  iconPosition = 'left',
  ...props
}) {
  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2',
    'font-medium tracking-wider uppercase',
    'rounded transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  );

  const content = (
    <>
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={baseClasses} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={baseClasses} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button className={baseClasses} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
