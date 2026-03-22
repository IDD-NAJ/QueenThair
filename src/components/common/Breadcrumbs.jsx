import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center gap-2 text-xs sm:text-sm text-text-muted flex-wrap" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-charcoal transition-colors">
        Home
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          {item.href ? (
            <Link to={item.href} className="hover:text-charcoal transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-charcoal">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
