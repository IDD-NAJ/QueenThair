import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to scroll to top on route changes
 * Provides reliable scroll-to-top functionality for all navigation
 */
export function useScrollToTop(options = {}) {
  const { pathname, search, hash } = useLocation();
  
  const {
    behavior = 'instant', // 'instant' for route changes, 'smooth' for manual calls
    delay = 0,
    handleHash = true
  } = options;

  useEffect(() => {
    const scrollToTop = () => {
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior
        });
        
        // Fallback for browsers that don't support behavior option
        if (window.scrollY !== 0) {
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      } catch (error) {
        // Ultimate fallback
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    };

    // Execute scroll immediately
    scrollToTop();

    // Double-check after delay to ensure it worked
    if (delay > 0) {
      const timeoutId = setTimeout(scrollToTop, delay);
      return () => clearTimeout(timeoutId);
    }

    // Handle hash fragments if enabled
    if (handleHash && hash) {
      setTimeout(() => {
        try {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        } catch (error) {
          console.warn(`Invalid hash fragment: ${hash}`);
        }
      }, 100);
    }
  }, [pathname, search, hash, behavior, delay, handleHash]);
}

/**
 * Manual scroll-to-top function for programmatic use
 */
export const scrollToTop = (options = {}) => {
  const { behavior = 'smooth' } = options;
  
  try {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior
    });
  } catch (error) {
    // Fallback for older browsers
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
};
