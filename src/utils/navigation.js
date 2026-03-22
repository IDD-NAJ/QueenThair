import { useNavigate } from 'react-router-dom';
import { scrollToTop } from '../hooks/useScrollToTop';

/**
 * Custom navigation hook that ensures scroll-to-top on navigation
 * Provides consistent navigation behavior across the app
 */
export function useNavigationWithScroll() {
  const navigate = useNavigate();

  const navigateToTop = (to, options = {}) => {
    const { 
      behavior = 'instant', 
      delay = 0,
      replace = false,
      state = null 
    } = options;

    // Navigate first
    navigate(to, { replace, state });

    // Then scroll to top
    if (delay > 0) {
      setTimeout(() => scrollToTop({ behavior }), delay);
    } else {
      scrollToTop({ behavior });
    }
  };

  return navigateToTop;
}

/**
 * Utility function for programmatic navigation with scroll-to-top
 * Can be used outside of React components
 */
export const navigateWithScroll = (navigate, to, options = {}) => {
  const { behavior = 'instant', delay = 0 } = options;
  
  navigate(to);
  
  if (delay > 0) {
    setTimeout(() => scrollToTop({ behavior }), delay);
  } else {
    scrollToTop({ behavior });
  }
};

/**
 * Handle anchor links with smooth scrolling
 */
export const handleAnchorLink = (e, hash, options = {}) => {
  e.preventDefault();
  
  const { behavior = 'smooth', offset = 0 } = options;
  
  if (hash) {
    try {
      const element = document.querySelector(hash);
      if (element) {
        const top = element.offsetTop - offset;
        window.scrollTo({
          top,
          behavior
        });
      }
    } catch (error) {
      console.warn(`Invalid anchor: ${hash}`);
      scrollToTop({ behavior: 'smooth' });
    }
  } else {
    scrollToTop({ behavior: 'smooth' });
  }
};
