// src/shared/components/wrappers/BrandWrapper.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/ui.foundations';

interface BrandWrapperProps {
  children: React.ReactNode;
  variant?: 'primary' | 'surface' | 'status';
  className?: string;
  as?: React.ElementType;
}

/**
 * 🛡️ BrandWrapper - Le Gardien de la Souveraineté Esthétique.
 * Enveloppe les composants (notamment tiers comme Radix/Shadcn) 
 * pour leur injecter les classes sémantiques de la marque.
 */
export function BrandWrapper({ 
  children, 
  variant = 'surface', 
  className,
  as: Component = 'div' 
}: BrandWrapperProps) {
  
  const variantClasses = {
    primary: 'bg-action-primary text-action-primary-fg border-focus',
    surface: 'bg-surface-card text-primary border-default',
    status:  'bg-surface-tertiary text-secondary border-subtle'
  };

  return (
    <Component 
      className={cn(
        'theme-transition',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </Component>
  );
}
