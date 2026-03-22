import { useEffect } from 'react';
import useStore from '../store/useStore';

export function useScrollPosition() {
  const setScrolled = useStore(state => state.setScrolled);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [setScrolled]);
}
