import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl sm:text-9xl font-serif text-gold mb-4">404</div>
        <h1 className="font-serif text-3xl sm:text-4xl text-charcoal mb-3">
          Page Not Found
        </h1>
        <p className="text-sm text-text-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button to="/" variant="secondary">
            Go Home
          </Button>
          <Button to="/shop" variant="outline">
            Browse Products
          </Button>
        </div>
      </div>
    </div>
  );
}
