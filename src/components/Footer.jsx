import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { subscribeToNewsletter } from '../services/newsletterService';
import useStore from '../store/useStore';

export default function Footer() {
  const navigate = useNavigate();
  const { showToast, user } = useStore();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting || !email.trim()) return;

    setIsSubmitting(true);

    try {
      const result = await subscribeToNewsletter(email, {
        source: 'footer',
        userId: user?.id || null,
      });

      if (result.success) {
        showToast('Successfully subscribed to our newsletter!');
        setEmail('');
      } else if (result.isDuplicate) {
        showToast('This email is already subscribed');
      } else {
        showToast(result.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      showToast('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-charcoal text-neutral-400 pt-16">
      <div className="max-w-[1440px] mx-auto px-10 grid grid-cols-4 gap-12 mb-12">
        <div>
          <span className="font-serif text-[22px] text-white mb-4 block tracking-[0.12em]">
            LUXE<span className="text-gold">HAIR</span>
          </span>
          <p className="text-[13px] leading-relaxed max-w-[260px] mb-5">
            Premium human hair wigs and extensions crafted for the discerning woman. Quality you can feel, style you can trust.
          </p>
          <div className="flex gap-2.5">
            {['IG', 'FB', 'TW', 'YT', 'TK'].map(s => (
              <div key={s} className="w-9 h-9 border border-white/15 rounded flex items-center justify-center text-neutral-400 transition-all hover:border-gold hover:text-gold cursor-pointer">
                <span className="text-[10px] font-semibold tracking-wider">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-white mb-4">Shop</div>
          <div className="flex flex-col gap-2">
            {['Lace Front Wigs', '360 Lace Wigs', 'Full Lace Wigs', 'Headband Wigs', 'Closures', 'Extensions', 'New Arrivals', 'Best Sellers'].map(l => (
              <div key={l} className="text-[13px] text-neutral-400 transition-colors hover:text-gold-light cursor-pointer" onClick={() => navigate('/catalog')}>
                {l}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-white mb-4">Information</div>
          <div className="flex flex-col gap-2">
            {[
              ['About Us', '/about'],
              ['Contact Us', '/contact'],
              ['Shipping Policy', '/shipping'],
              ['Return Policy', '/returns'],
              ['FAQ', '/faq'],
              ['Size Guide', '/size-guide'],
              ['Care Guide', '/care']
            ].map(([label, path]) => (
              <div key={label} className="text-[13px] text-neutral-400 transition-colors hover:text-gold-light cursor-pointer" onClick={() => navigate(path)}>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-white mb-4">Newsletter</div>
          <p className="text-[13px] text-neutral-400 mb-4 leading-relaxed">
            Subscribe for exclusive offers, new arrivals, and hair care tips.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isSubmitting}
              className="px-3 py-2 bg-white/5 border border-white/15 rounded text-[13px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gold text-charcoal text-[12px] font-semibold tracking-wider uppercase rounded hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Subscribing...
                </>
              ) : (
                'Subscribe'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/8 py-5 px-10 flex items-center justify-between max-w-[1440px] mx-auto">
        <span className="text-xs text-neutral-500">© 2026 QUEENTHAIR. All rights reserved.</span>
        <div className="flex gap-2 items-center">
          {['VISA', 'MC', 'AMEX', 'PAYPAL', 'STRIPE'].map(p => (
            <div key={p} className="bg-white/8 rounded px-2 py-1 text-[10px] text-neutral-400 tracking-wider font-semibold">
              {p}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
