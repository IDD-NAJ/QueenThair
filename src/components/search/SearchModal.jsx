import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { analytics } from '../../utils/analytics';

export default function SearchModal() {
  const navigate = useNavigate();
  const searchOpen = useStore(state => state.searchOpen);
  const setSearchOpen = useStore(state => state.setSearchOpen);
  const [query, setQuery] = useState('');

  useLockBodyScroll(searchOpen);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      analytics.search(query);
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  useEffect(() => {
    if (!searchOpen) {
      setQuery('');
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [searchOpen, setSearchOpen]);

  const handleProductClick = (slug) => {
    navigate(`/product/${slug}`);
    setSearchOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchOpen(false);
    }
  };

  const popularSearches = ['Lace Front Wigs', 'Body Wave', 'Straight Wigs', 'HD Lace', '360 Lace'];

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-[100] flex flex-col items-center pt-20 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white w-full max-w-2xl rounded-lg overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative border-b border-border">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for wigs, styles, textures..."
                className="w-full pl-12 pr-12 py-4 text-base text-text-primary outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded text-text-muted hover:bg-neutral-100 hover:text-charcoal transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <div className="py-2">
                <div className="text-xs tracking-wider uppercase text-text-muted mb-3">
                  Popular Searches
                </div>
                <div className="space-y-1">
                  {popularSearches.map(term => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="block w-full text-left py-2 px-3 text-sm text-text-secondary rounded transition-colors hover:bg-neutral-100"
                    >
                      {term}
                    </button>
                  ))}
                </div>
                {query && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <button
                      onClick={handleSearch}
                      className="w-full py-2.5 px-4 bg-charcoal text-white rounded hover:bg-dark-brown transition-colors text-sm font-medium"
                    >
                      Search for "{query}"
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
