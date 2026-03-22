import React from 'react';
import Button from './Button';
import { cn } from '../../utils/cn';

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}) {
  return (
    <div className={cn('text-center py-16 sm:py-20', className)}>
      {icon && (
        <div className="text-5xl sm:text-6xl mb-4 opacity-30">{icon}</div>
      )}
      <h3 className="font-serif text-2xl sm:text-3xl text-text-secondary mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <Button
          to={action.href}
          variant={action.variant || 'secondary'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
