import React from 'react';
import Breadcrumbs from '../components/common/Breadcrumbs';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-warm-white">
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-text-muted mt-2">Last updated: March 17, 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="prose prose-sm sm:prose max-w-none text-text-secondary">
          <p className="lead text-base">
            At QUEENTHAIR, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Name, email address, and contact information</li>
            <li>Billing and shipping addresses</li>
            <li>Payment information (processed securely through our payment providers)</li>
            <li>Order history and preferences</li>
            <li>Communications with our customer service team</li>
          </ul>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your orders and account</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Improve our website and customer service</li>
            <li>Prevent fraud and enhance security</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">Information Sharing</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul>
            <li>Service providers who assist with order fulfillment, payment processing, and shipping</li>
            <li>Analytics providers to help us understand how our website is used</li>
            <li>Law enforcement when required by law</li>
          </ul>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can control cookies through your browser settings.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and receive a copy of your personal data</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Object to certain processing of your data</li>
          </ul>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">Children's Privacy</h2>
          <p>
            Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2 className="font-serif text-2xl text-charcoal mt-8 mb-4">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p>
            Email: privacy@Queenthair.com<br />
            Phone: 1-800-QUEENTHAIR<br />
            Address: 123 Beauty Lane, Los Angeles, CA 90001
          </p>
        </div>
      </div>
    </div>
  );
}
