'use client';

import { cn } from '@/lib/ui.foundations';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import type { StatCardIntent } from '@/shared/components/ui/types';

interface SalonStatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  emoji?: string;
  trend?: string | { value: number; direction: 'up' | 'down' | 'neutral' };
  isWarning?: boolean;
  intent?: StatCardIntent;
  variant?: 'compact' | 'default' | 'large' | 'minimal';
  className?: string;
}

// Utiliser les CSS variables du design system — pas de hex hardcodé.
// Fallback hex uniquement pour brand (couleur tenant personnalisable → pas de token fixe).
const intentAccent: Record<StatCardIntent, string> = {
  brand:   'var(--action-primary, #D4A5C7)',
  success: 'var(--status-success, #10b981)',
  warning: 'var(--status-warning, #f59e0b)',
  danger:  'var(--status-danger, #ef4444)',
  info:    'var(--action-secondary, #9B59B6)',
  neutral: 'var(--text-muted, #94a3b8)',
};

/**
 * SalonStatCard — variante élégante de StatCard pour le vertical salon/beauté.
 * Style : rondeur maximale (pill), ombres douces, typographie serif, tons chauds.
 * Même contrat de props que StatCard — interchangeable via withVerticalOverride.
 */
export function SalonStatCard({
  label,
  value,
  icon,
  emoji,
  trend,
  isWarning,
  intent = 'brand',
  variant = 'default',
  className,
}: SalonStatCardProps) {
  const accent = intentAccent[intent];
  const isCompact = variant === 'compact' || variant === 'minimal';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-bg-secondary border rounded-[2.5rem] transition-all duration-300",
        "hover:shadow-[0_8px_32px_rgba(212,165,199,0.18)] group",
        isWarning ? "border-[#D4A5C7]/40" : "border-border",
        isCompact ? "p-4" : variant === 'large' ? "p-8" : "p-6",
        className
      )}
      role="region"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between mb-4">
        {/* Icon — pill shape */}
        <div
          className={cn(
            "flex items-center justify-center rounded-full",
            isCompact ? "w-10 h-10" : variant === 'large' ? "w-16 h-16" : "w-12 h-12"
          )}
          style={{
            background: `radial-gradient(circle at 30% 30%, ${accent}30, ${accent}15)`,
            boxShadow: `0 4px 16px ${accent}25`,
          }}
        >
          {emoji ? (
            <span className={isCompact ? "text-base" : "text-xl"}>{emoji}</span>
          ) : icon ? (
            <span style={{ color: accent }}>{icon}</span>
          ) : null}
        </div>

        {trend && typeof trend === 'object' && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full",
            trend.direction === 'up'      && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            trend.direction === 'down'    && "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
            trend.direction === 'neutral' && "bg-surface-card text-text-muted"
          )}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '·'}
            {trend.value}%
          </div>
        )}
      </div>

      <div>
        <p
          className={cn(
            "font-serif font-medium tracking-tight italic text-text-primary",
            "group-hover:text-[color:var(--action-primary)] transition-colors",
            variant === 'large' ? "text-4xl" : isCompact ? "text-2xl" : "text-3xl"
          )}
        >
          {value}
        </p>
        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.25em] mt-1.5">
          {label}
        </p>
        {trend && typeof trend === 'string' && (
          <p className="text-[9px] font-medium text-text-muted mt-1 italic">{trend}</p>
        )}
      </div>
    </motion.div>
  );
}
