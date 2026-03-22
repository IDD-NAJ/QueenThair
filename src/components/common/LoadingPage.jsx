import React from 'react';

export default function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-white">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold mb-4"></div>
        <div className="font-serif text-2xl text-charcoal">
          QUEEN<span className="text-gold">THAIR</span>
        </div>
      </div>
    </div>
  );
}
