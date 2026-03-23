import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Preloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for window to load or just after a small delay
    const handleLoad = () => {
      // Small delay just to make the preloader visible for a moment
      setTimeout(() => setLoading(false), 1200);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      // Fallback in case load event already triggered or takes too long
      const fallbackTimer = setTimeout(handleLoad, 3000);
      return () => {
        window.removeEventListener('load', handleLoad);
        clearTimeout(fallbackTimer);
      };
    }
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-charcoal"
        >
          {/* Logo or Brand Name */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center justify-center"
          >
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-gold-light tracking-wider font-light mb-4">
              QUEENTHAIR
            </h1>
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/60 mb-8 font-sans">
              London • Paris • New York
            </div>

            {/* Custom elegant loader */}
            <div className="relative w-[1px] h-16 bg-white/10 overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 w-full h-full bg-gold"
                initial={{ y: "-100%" }}
                animate={{ y: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
