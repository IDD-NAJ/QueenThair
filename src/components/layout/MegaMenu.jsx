import React from 'react';
import { Link } from 'react-router-dom';
import Img from '../common/Img';

export default function MegaMenu({ item, onClose }) {
  if (item.submenu) {
    return (
      <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white border border-border border-t-2 border-t-gold shadow-lg min-w-[200px] py-2 animate-slide-down z-50">
        {item.submenu.map((link, i) => (
          <Link
            key={i}
            to={link.href}
            className="block px-4 py-2 text-sm text-text-secondary hover:bg-neutral-100 hover:text-charcoal transition-colors"
            onClick={onClose}
          >
            {link.label}
          </Link>
        ))}
      </div>
    );
  }

  if (item.cols) {
    return (
      <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white border border-border border-t-2 border-t-gold shadow-lg min-w-[720px] p-7 flex gap-8 animate-slide-down z-50">
        {item.cols.map((col, j) => (
          <div key={j} className="min-w-[160px]">
            {col.feature ? (
              <div className="bg-neutral-100 p-4 rounded min-w-[180px]">
                <Img 
                  src={col.image || `/images/categories/${col.slug}.jpg`}
                  alt={col.title2}
                  className="w-full h-[120px] mb-2.5 rounded" 
                />
                <div className="text-sm font-medium text-charcoal mb-1">{col.title2}</div>
                <div className="text-xs text-text-muted mb-2">{col.sub}</div>
                <Link
                  to={col.href}
                  className="text-xs text-gold hover:text-gold-light transition-colors"
                  onClick={onClose}
                >
                  Shop Now →
                </Link>
              </div>
            ) : (
              <>
                <div className="text-[10px] tracking-[0.14em] uppercase font-semibold text-text-muted mb-3 pb-2 border-b border-border">
                  {col.title}
                </div>
                {col.links?.map((link, k) => (
                  <Link
                    key={k}
                    to={link.href}
                    className="block text-sm text-text-secondary py-1 transition-colors hover:text-charcoal"
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
