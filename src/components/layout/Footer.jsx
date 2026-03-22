import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import Button from '../common/Button';
import Input from '../common/Input';
import useStore from '../../store/useStore';
import { subscribeToNewsletter } from '../../services/newsletterService';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [expandedSections, setExpandedSections] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const showToast = useStore(state => state.showToast);

  const toggleSection = (index) => {
    setExpandedSections(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showToast('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await subscribeToNewsletter(email, {
        source: 'footer',
        userId: null,
      });

      if (result.success) {
        showToast('🎉 Successfully subscribed! Check your inbox for exclusive offers.');
        setEmail('');
      } else if (result.isDuplicate) {
        showToast('This email is already subscribed');
      } else {
        showToast(result.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      showToast('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerSections = [
    {
      title: 'Shop',
      links: [
        { label: 'Lace Front Wigs', href: '/shop/lace-front-wigs' },
        { label: '360 Lace Wigs', href: '/shop/360-lace-wigs' },
        { label: 'Full Lace Wigs', href: '/shop/full-lace-wigs' },
        { label: 'Headband Wigs', href: '/shop/headband-wigs' },
        { label: 'Closures', href: '/shop/closure-wigs' },
        { label: 'Extensions', href: '/shop' },
        { label: 'New Arrivals', href: '/collections/new-arrivals' },
        { label: 'Best Sellers', href: '/collections/best-sellers' },
      ],
    },
    {
      title: 'Information',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Shipping & Returns', href: '/shipping-returns' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Track Order', href: '/track-order' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms & Conditions', href: '/terms' },
      ],
    },
    {
      title: 'My Account',
      links: [
        { label: 'Sign In', href: '/login' },
        { label: 'Register', href: '/register' },
        { label: 'Order History', href: '/account/orders' },
        { label: 'Wishlist', href: '/wishlist' },
        { label: 'My Profile', href: '/account/profile' },
      ],
    },
  ];

  return (
    <footer className="bg-charcoal text-neutral-400">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-[10px] tracking-[0.2em] uppercase text-gold mb-3">
              Join the Community
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mb-3">
              Get <em className="italic text-gold-light">Exclusive</em> Style Updates
            </h2>
            <p className="text-sm text-white/55 mb-7">
              Subscribe for early access to new arrivals, member-only discounts, and hair care tips.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                required
              />
              <Button 
                type="submit" 
                variant="secondary" 
                className="whitespace-nowrap"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="font-serif text-xl sm:text-2xl text-white mb-4 block tracking-[0.12em]">
              QUEEN<span className="text-gold">THAIR</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-[260px] mb-5">
              Premium human hair wigs and extensions crafted for the discerning woman. Quality you can feel, style you can trust.
            </p>
            <div className="flex gap-2.5">
              {['IG', 'FB', 'TW', 'YT', 'TK'].map(s => (
                <a
                  key={s}
                  href="#"
                  className="w-9 h-9 border border-white/15 rounded flex items-center justify-center text-neutral-400 transition-all hover:border-gold hover:text-gold"
                  aria-label={s}
                >
                  <span className="text-[10px] font-semibold tracking-wider">{s}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index} className="lg:col-span-1">
              {isMobile ? (
                <>
                  <button
                    onClick={() => toggleSection(index)}
                    className="flex items-center justify-between w-full text-xs tracking-[0.14em] uppercase font-semibold text-white mb-4 py-2 border-b border-white/10"
                  >
                    {section.title}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedSections.includes(index) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedSections.includes(index) && (
                    <div className="flex flex-col gap-2 mb-4">
                      {section.links.map((link, i) => (
                        <Link
                          key={i}
                          to={link.href}
                          className="text-sm text-neutral-400 transition-colors hover:text-gold-light"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-xs tracking-[0.14em] uppercase font-semibold text-white mb-4">
                    {section.title}
                  </div>
                  <div className="flex flex-col gap-2">
                    {section.links.map((link, i) => (
                      <Link
                        key={i}
                        to={link.href}
                        className="text-sm text-neutral-400 transition-colors hover:text-gold-light"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/8">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-neutral-500">
            © 2026 QUEENTHAIR. All rights reserved.
          </span>
          <div className="flex gap-2 items-center flex-wrap justify-center">
            {['VISA', 'MC', 'AMEX', 'PAYPAL', 'STRIPE'].map(p => (
              <div
                key={p}
                className="bg-white/8 rounded px-2 py-1 text-[10px] text-neutral-400 tracking-wider font-semibold"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
