import React from 'react';
import Breadcrumbs from '../components/common/Breadcrumbs';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-warm-white">
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'Terms & Conditions' }]} />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            Terms & Conditions
          </h1>
          <p className="text-sm text-text-muted mt-2">Last updated: March 17, 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="prose prose-sm sm:prose max-w-none text-text-secondary">
          <p className="lead text-base">
            Please read these Terms and Conditions carefully before using the QUEENTHAIR website. By accessing or using our website, you agree to be bound by these terms.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our website.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">2. Use of Website</h2>
          <p>You agree to use our website only for lawful purposes and in a way that does not infringe the rights of others or restrict their use of the website.</p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">3. Product Information</h2>
          <p>
            We strive to provide accurate product descriptions and images. However, we do not warrant that product descriptions, images, or other content is accurate, complete, reliable, current, or error-free.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">4. Pricing and Availability</h2>
          <p>
            All prices are subject to change without notice. We reserve the right to modify or discontinue products at any time. We are not liable for any price changes or product unavailability.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">5. Orders and Payment</h2>
          <p>
            By placing an order, you are offering to purchase products subject to these terms. We reserve the right to refuse or cancel any order for any reason. Payment must be received before order processing.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">6. Intellectual Property</h2>
          <p>
            All content on this website, including text, graphics, logos, images, and software, is the property of QUEENTHAIR and protected by copyright and trademark laws.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">7. Limitation of Liability</h2>
          <p>
            QUEENTHAIR shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the website or products.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">8. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website constitutes acceptance of the modified terms.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">10. Contact Information</h2>
          <p>
            For questions about these Terms and Conditions, please contact us at:
          </p>
          <p>
            Email: legal@Queenthair.com<br />
            Phone: 1-800-QUEENTHAIR<br />
            Address: 123 Beauty Lane, Los Angeles, CA 90001
          </p>
        </div>
      </div>
    </div>
  );
}
