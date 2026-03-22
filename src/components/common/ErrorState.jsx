import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function ErrorState({ 
  error, 
  title = 'Something went wrong',
  message,
  onRetry,
  showHomeButton = false 
}) {
  const errorMessage = message || error?.message || 'An unexpected error occurred. Please try again.';

  return (
    <div className="flex items-center justify-center min-h-[400px] px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-charcoal mb-2">{title}</h3>
        <p className="text-text-muted mb-6">{errorMessage}</p>
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 bg-gold text-white py-2.5 px-6 text-sm tracking-[0.1em] uppercase font-medium rounded transition-all hover:bg-gold-light"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          
          {showHomeButton && (
            <a
              href="/"
              className="inline-flex items-center gap-2 border border-border py-2.5 px-6 text-sm tracking-[0.1em] uppercase font-medium rounded transition-all hover:border-charcoal"
            >
              <Home className="w-4 h-4" />
              Go Home
            </a>
          )}
        </div>

        {import.meta.env.DEV && error?.stack && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-red-600 cursor-pointer">Error Details (Dev Only)</summary>
            <pre className="mt-2 text-xs bg-red-50 p-3 rounded overflow-auto text-red-800 max-h-40">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
