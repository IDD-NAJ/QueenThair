import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-6">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-3">
              <span className="font-serif text-xl text-charcoal">
                QUEEN<span className="text-gold">THAIR</span>
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Premium human hair wigs and extensions for the modern woman.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard/orders" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/dashboard/wishlist" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard/profile" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  Profile Settings
                </Link>
              </li>
              <li>
                <Link to="/dashboard/addresses" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  Addresses
                </Link>
              </li>
              <li>
                <Link to="/dashboard/security" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link to="/care" className="text-sm text-gray-600 hover:text-gold transition-colors">
                  Care Guide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              © {currentYear} QUEENTHAIR. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-xs text-gray-500 hover:text-gold transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-xs text-gray-500 hover:text-gold transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
