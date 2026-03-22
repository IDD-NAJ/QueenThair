import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-charcoal text-neutral-300 relative">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between sm:justify-center gap-4 py-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 sm:gap-7 flex-wrap justify-center flex-1">
            <span className="whitespace-nowrap">🚚 Free shipping on orders over $99</span>
            <span className="hidden sm:inline">|</span>
            <span className="whitespace-nowrap">
              ✨ Use code <strong className="text-gold-light">QUEEN20</strong> for 20% off
            </span>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="sm:absolute sm:right-4 p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Close announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
