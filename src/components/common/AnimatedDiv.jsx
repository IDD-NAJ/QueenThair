import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedDiv({ 
  children, 
  className = '', 
  delay = 0,
  animation = 'fadeInUp',
  ...props 
}) {
  const animations = {
    fadeInUp: {
      initial: { opacity: 0, y: 20 },
      whileInView: { opacity: 1, y: 0 },
    },
    fadeIn: {
      initial: { opacity: 0 },
      whileInView: { opacity: 1 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      whileInView: { opacity: 1, scale: 1 },
    },
    slideInLeft: {
      initial: { opacity: 0, x: -30 },
      whileInView: { opacity: 1, x: 0 },
    },
    slideInRight: {
      initial: { opacity: 0, x: 30 },
      whileInView: { opacity: 1, x: 0 },
    },
  };

  const selectedAnimation = animations[animation] || animations.fadeInUp;

  return (
    <motion.div
      initial={selectedAnimation.initial}
      whileInView={selectedAnimation.whileInView}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
