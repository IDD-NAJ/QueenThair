import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const navigate = useNavigate();

  return (
    <div className="bg-charcoal text-neutral-300 text-xs tracking-wider text-center py-2 px-5 flex items-center justify-between">
      <div className="flex gap-4 text-xs text-neutral-400">
        <span onClick={() => navigate('/about')} className="cursor-pointer hover:text-gold-light transition-colors">About Us</span>
        <span>|</span>
        <span onClick={() => navigate('/contact')} className="cursor-pointer hover:text-gold-light transition-colors">Contact</span>
      </div>
      <div className="flex gap-7 items-center">
        <span>🚚 Free shipping on orders over $99</span>
        <span>|</span>
        <span>✨ Use code <strong className="text-gold-light">LUXE20</strong> for 20% off</span>
      </div>
      <div className="flex gap-4 items-center">
        <span className="cursor-pointer flex items-center gap-1">USD $</span>
        <span>|</span>
        <span className="cursor-pointer" onClick={() => navigate('/login')}>Sign In</span>
      </div>
    </div>
  );
}
