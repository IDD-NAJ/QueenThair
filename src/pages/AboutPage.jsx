import React from 'react';
import { motion } from 'framer-motion';
import Breadcrumbs from '../components/common/Breadcrumbs';

export default function AboutPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-warm-white"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-border"
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'About Us' }]} />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            About Us
          </h1>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12"
      >
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mb-3">Our Story</h2>
          <p className="text-base sm:text-lg text-text-muted">Premium hair for the modern woman</p>
        </div>
        <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
          <h3 className="font-serif text-2xl sm:text-3xl font-normal text-charcoal mb-4">Who We Are</h3>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4">
            QUEENTHAIR was founded with a simple mission: to provide premium quality human hair wigs and extensions that empower women to express their unique beauty. We believe that every woman deserves to feel confident and beautiful, and our products are designed to help you achieve that effortlessly.
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-8">
            Our team of hair experts carefully sources the finest 100% virgin human hair from ethical suppliers around the world. Each piece is meticulously crafted to ensure the highest standards of quality, durability, and natural appearance.
          </p>

          <h3 className="font-serif text-2xl sm:text-3xl font-normal text-charcoal mb-4">Our Commitment</h3>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4">
            We are committed to providing exceptional customer service and products that exceed your expectations. From our premium materials to our attention to detail in construction, every aspect of our wigs and extensions reflects our dedication to excellence.
          </p>
          <ul className="space-y-2 mb-8">
            <li className="text-sm sm:text-base text-text-secondary leading-relaxed flex items-start gap-2">
              <span className="text-gold mt-1">✓</span>
              <span>100% virgin human hair from ethical sources</span>
            </li>
            <li className="text-sm sm:text-base text-text-secondary leading-relaxed flex items-start gap-2">
              <span className="text-gold mt-1">✓</span>
              <span>Handcrafted with meticulous attention to detail</span>
            </li>
            <li className="text-sm sm:text-base text-text-secondary leading-relaxed flex items-start gap-2">
              <span className="text-gold mt-1">✓</span>
              <span>Natural-looking, undetectable hairlines</span>
            </li>
            <li className="text-sm sm:text-base text-text-secondary leading-relaxed flex items-start gap-2">
              <span className="text-gold mt-1">✓</span>
              <span>Durable construction for long-lasting wear</span>
            </li>
            <li className="text-sm sm:text-base text-text-secondary leading-relaxed flex items-start gap-2">
              <span className="text-gold mt-1">✓</span>
              <span>Exceptional customer service and support</span>
            </li>
          </ul>

          <h3 className="font-serif text-2xl sm:text-3xl font-normal text-charcoal mb-4">Why Choose QUEENTHAIR</h3>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4">
            When you choose QUEENTHAIR, you're choosing more than just a product – you're choosing a partner in your beauty journey. We stand behind every piece we sell with our 30-day satisfaction guarantee and lifetime customer support.
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Join thousands of satisfied customers who have discovered the QUEENTHAIR difference. Experience the confidence that comes with wearing premium quality hair that looks and feels completely natural.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
