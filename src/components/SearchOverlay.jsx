import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Img from './Img';

export default function SearchOverlay() {
  const navigate = useNavigate();
  const { searchOpen, setSearchOpen } = useApp();
  const [query, setQuery] = useState('');

  // Search functionality redirects to SearchPage
  const results = [];

  const handleProductClick = (id) => {
    navigate(`/product/${id}`);
    setSearchOpen(false);
    setQuery('');
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 z-[1500] flex flex-col items-center pt-20 transition-opacity ${searchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={() => setSearchOpen(false)}
    >
      <div 
        className="bg-white w-full max-w-[680px] rounded overflow-hidden shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <input 
          className="w-full border-none p-4 text-base text-text-primary outline-none border-b border-border"
          placeholder="Search for wigs, styles, textures..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={searchOpen}
        />
        <div className="p-4">
          {results.length > 0 ? (
            results.map(p => (
              <div 
                key={p.id}
                className="flex items-center gap-3 p-2.5 rounded cursor-pointer transition-colors hover:bg-neutral-100"
                onClick={() => handleProductClick(p.id)}
              >
                <Img seed={p.id} className="w-11 h-14 rounded" />
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-charcoal">{p.name}</div>
                  <div className="text-xs text-gold">${p.price}</div>
                </div>
              </div>
            ))
          ) : query.length > 1 ? (
            <div className="py-3 text-[13px] text-text-muted text-center">
              No results for "{query}"
            </div>
          ) : (
            <div className="py-2">
              <div className="text-[11px] tracking-[0.1em] uppercase text-text-muted mb-2.5">Popular Searches</div>
              {['Lace Front Wigs', 'Body Wave', 'Straight Wigs', 'HD Lace'].map(t => (
                <div 
                  key={t}
                  className="py-2 text-[13px] text-text-secondary cursor-pointer hover:bg-neutral-100 px-2 rounded"
                  onClick={() => setQuery(t)}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
