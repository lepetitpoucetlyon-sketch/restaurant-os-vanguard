import React from 'react';
import { cn } from '@/lib/ui.foundations';

// --- GLASS CARD ---
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark';
  glow?: 'primary' | 'danger' | 'none';
  lift?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'light', glow = 'none', lift = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          variant === 'light' ? 'glass-panel-light' : 'glass-panel-dark',
          glow === 'primary' && 'shadow-glow-accent border-action-primary',
          glow === 'danger' && 'shadow-neon-danger border-action-danger',
          lift && 'hover-lift hover-glow',
          'rounded-[var(--radius-lg)] p-6 text-[var(--text-primary)]',
          className
        )}
        {...props}
      />
    );
  }
);
GlassCard.displayName = 'GlassCard';


// --- GLASS BUTTON ---
export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-[var(--text-fluid-xs)] rounded-[var(--radius-sm)]',
      md: 'px-5 py-2.5 text-[var(--text-fluid-sm)] rounded-[var(--radius-md)]',
      lg: 'px-8 py-3.5 text-[var(--text-fluid-base)] rounded-[var(--radius-lg)]',
      icon: 'w-10 h-10 p-2 flex items-center justify-center rounded-full',
    };

    const variantClasses = {
      primary: 'bg-[var(--color-action-primary)] text-[var(--color-action-primary-fg)] hover:shadow-neon-primary hover-lift',
      secondary: 'glass-panel-light hover:bg-[var(--color-action-primary)] hover:text-white hover-lift',
      danger: 'bg-[var(--color-action-danger)] text-white hover:shadow-neon-danger hover-lift',
      ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--glass-border-light)]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-300 ease-out-expo disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
GlassButton.displayName = 'GlassButton';


// --- GLASS INPUT ---
export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-[var(--glass-bg-light)] backdrop-blur-md border border-[var(--glass-border-light)] text-[var(--text-primary)] placeholder-[var(--text-muted)]',
            'rounded-[var(--radius-md)] px-4 py-2.5 transition-all duration-300',
            'focus:outline-none focus:border-[var(--color-action-primary)] focus:shadow-neon-primary focus:bg-white',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
GlassInput.displayName = 'GlassInput';
