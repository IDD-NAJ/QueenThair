import React from 'react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { Truck, Package, RefreshCw, Shield } from 'lucide-react';

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-warm-white">
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'Shipping & Returns' }]} />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            Shipping & Returns
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="prose prose-sm sm:prose max-w-none">
          {/* Shipping */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-gold" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal m-0">Shipping Information</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-charcoal mb-2">Shipping Options</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li><strong>Standard Shipping (FREE on orders $99+):</strong> 5-7 business days</li>
                  <li><strong>Express Shipping ($19.99):</strong> 2-3 business days</li>
                  <li><strong>Overnight Shipping ($29.99):</strong> Next business day</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-charcoal mb-2">Processing Time</h3>
                <p className="text-text-secondary">
                  Orders are processed within 1-2 business days. You'll receive a confirmation email with tracking information once your order ships.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-charcoal mb-2">International Shipping</h3>
                <p className="text-text-secondary">
                  We ship to over 100 countries worldwide. International shipping times vary by location (typically 7-14 business days). Customs fees and import duties are the responsibility of the customer.
                </p>
              </div>
            </div>
          </div>

          {/* Returns */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-gold" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal m-0">Return Policy</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-charcoal mb-2">30-Day Returns</h3>
                <p className="text-text-secondary">
                  We want you to love your purchase! If you're not completely satisfied, you can return items within 30 days of delivery for a full refund.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-charcoal mb-2">Return Requirements</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li>Items must be unworn, unwashed, and in original condition</li>
                  <li>All original tags and packaging must be included</li>
                  <li>Wigs must not have been cut, colored, or styled</li>
                  <li>Final sale items cannot be returned</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-charcoal mb-2">How to Return</h3>
                <ol className="space-y-2 text-text-secondary list-decimal list-inside">
                  <li>Log into your account and go to Order History</li>
                  <li>Select the item(s) you wish to return</li>
                  <li>Print your prepaid return label</li>
                  <li>Pack items securely and attach the label</li>
                  <li>Drop off at any authorized shipping location</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-charcoal mb-2">Refund Processing</h3>
                <p className="text-text-secondary">
                  Refunds are processed within 5-7 business days after we receive your return. The refund will be credited to your original payment method.
                </p>
              </div>
            </div>
          </div>

          {/* Exchanges */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-gold" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal m-0">Exchanges</h2>
            </div>

            <p className="text-text-secondary mb-4">
              We currently don't offer direct exchanges. If you need a different size, color, or style, please return your original item and place a new order.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-neutral-100 border border-border rounded-lg p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-gold" />
              </div>
              <h2 className="font-serif text-2xl text-charcoal m-0">Need Help?</h2>
            </div>
            <p className="text-text-secondary mb-4">
              Our customer service team is available 24/7 to assist with shipping and returns questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-gold text-white text-sm tracking-wider uppercase font-medium rounded transition-all hover:bg-gold-light"
              >
                Contact Support
              </a>
              <a
                href="/track-order"
                className="inline-flex items-center justify-center px-6 py-2.5 border border-border text-sm text-text-secondary rounded transition-all hover:bg-white"
              >
                Track Order
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
