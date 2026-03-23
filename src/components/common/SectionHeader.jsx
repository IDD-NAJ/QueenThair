import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function SectionHeader({ 
  label, 
  title, 
  subtitle, 
  action,
  className 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className={cn('flex items-end justify-between mb-8 sm:mb-10', className)}
    >
      <div>
        {label && (
          <div className="text-[10px] tracking-[0.18em] uppercase text-gold mb-2 flex items-center gap-2">
            <span className="w-5 h-px bg-gold" />
            {label}
          </div>
        )}
        <h2 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-text-muted mt-2">{subtitle}</p>
        )}
      </div>
      {action && (
        <Link
          to={action.href}
          className="text-xs tracking-[0.1em] uppercase text-gold-muted flex items-center gap-1.5 transition-colors hover:text-gold whitespace-nowrap"
        >
          {action.label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </motion.div>
  );
}
