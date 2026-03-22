import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { cn } from '../utils/cn';

const faqs = [
  {
    category: 'Orders & Shipping',
    questions: [
      {
        q: 'How long does shipping take?',
        a: 'Standard shipping takes 5-7 business days. Express shipping (2-3 days) and overnight shipping options are also available at checkout.'
      },
      {
        q: 'Do you ship internationally?',
        a: 'Yes, we ship to over 100 countries worldwide. International shipping times vary by location, typically 7-14 business days.'
      },
      {
        q: 'How can I track my order?',
        a: 'Once your order ships, you\'ll receive a tracking number via email. You can also track your order by logging into your account.'
      },
    ]
  },
  {
    category: 'Products',
    questions: [
      {
        q: 'Are your wigs made from real human hair?',
        a: 'Yes, all our wigs are made from 100% virgin human hair. This means the hair has never been chemically processed and maintains its natural texture and quality.'
      },
      {
        q: 'How do I choose the right wig?',
        a: 'Consider your face shape, lifestyle, and desired look. Our customer service team is available 24/7 to help you choose the perfect wig for your needs.'
      },
      {
        q: 'Can I dye or style the wigs?',
        a: 'Yes! Since our wigs are made from 100% human hair, you can dye, cut, and style them just like your natural hair. We recommend consulting with a professional stylist.'
      },
    ]
  },
  {
    category: 'Returns & Exchanges',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 30-day return policy. Items must be unworn, unwashed, and in original packaging with all tags attached.'
      },
      {
        q: 'How do I initiate a return?',
        a: 'Log into your account, go to Order History, and select the item you wish to return. Follow the prompts to print your return label.'
      },
      {
        q: 'When will I receive my refund?',
        a: 'Refunds are processed within 5-7 business days after we receive your return. The refund will be credited to your original payment method.'
      },
    ]
  },
  {
    category: 'Care & Maintenance',
    questions: [
      {
        q: 'How do I wash my wig?',
        a: 'Wash your wig every 7-10 wears using sulfate-free shampoo and conditioner. Gently detangle, wash in cool water, and air dry on a wig stand.'
      },
      {
        q: 'How long will my wig last?',
        a: 'With proper care, our wigs can last 1-2 years or longer. Lifespan depends on frequency of wear and maintenance.'
      },
      {
        q: 'Can I sleep in my wig?',
        a: 'We don\'t recommend sleeping in your wig as it can cause tangling and reduce its lifespan. Remove and store on a wig stand overnight.'
      },
    ]
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState([]);

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'FAQ' }]} />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Find answers to common questions about our products and services
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="space-y-8">
          {faqs.map((category, catIndex) => (
            <div key={catIndex}>
              <h2 className="text-xs tracking-wider uppercase font-semibold text-gold mb-4">
                {category.category}
              </h2>
              <div className="space-y-2">
                {category.questions.map((item, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openItems.includes(key);
                  
                  return (
                    <div key={qIndex} className="bg-white border border-border rounded overflow-hidden">
                      <button
                        onClick={() => toggleItem(catIndex, qIndex)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-neutral-50"
                      >
                        <span className="text-sm sm:text-base font-medium text-charcoal pr-4">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={cn(
                            'w-5 h-5 text-text-muted flex-shrink-0 transition-transform',
                            isOpen && 'rotate-180'
                          )}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-neutral-100 border border-border rounded-lg p-6 sm:p-8 text-center">
          <h3 className="font-serif text-2xl text-charcoal mb-2">
            Still have questions?
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Our customer support team is here to help
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-gold text-white text-sm tracking-wider uppercase font-medium rounded transition-all hover:bg-gold-light"
            >
              Contact Us
            </a>
            <a
              href="mailto:support@Queenthair.com"
              className="inline-flex items-center justify-center px-6 py-2.5 border border-border text-sm text-text-secondary rounded transition-all hover:bg-white"
            >
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
