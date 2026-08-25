'use client';

import { cn } from '@/lib/ui.foundations';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { StatCardIntent } from '@/shared/components/ui/StatCardTypes';

interface GarageStatCardProps {
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
  brand:   'var(--action-primary, #2C3E50)',
  success: 'var(--status-success, #10b981)',
  warning: 'var(--status-warning, #f59e0b)',
  danger:  'var(--status-danger, #E74C3C)',
  info:    'var(--action-secondary, #3498DB)',
  neutral: 'var(--text-muted, #64748B)',
};

/**
 * GarageStatCard — variante industrielle de StatCard.
 * Style : géométrie carrée, typographie Rajdhani, accent rouge véhicule.
 * Même contrat de props que StatCard — interchangeable via withVerticalOverride.
 */
export function GarageStatCard({
  label,
  value,
  icon,
  emoji,
  trend,
  isWarning,
  intent = 'brand',
  variant = 'default',
  className,
}: GarageStatCardProps) {
  const accent = intentAccent[intent];
  const isCompact = variant === 'compact' || variant === 'minimal';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-bg-secondary border border-border rounded-sm transition-all duration-200 hover:border-[color:var(--action-primary)] group",
        isWarning && "border-status-danger/40",
        isCompact ? "p-4" : variant === 'large' ? "p-8" : "p-6",
        className
      )}
      role="region"
      aria-label={`${label}: ${value}`}
    >
      {/* Barre accent sur la gauche — esthétique industrielle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-none"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-start justify-between mb-3">
        {/* Icon zone — carré strict, pas de border-radius */}
        <div
          className={cn(
            "flex items-center justify-center rounded-sm",
            isCompact ? "w-8 h-8" : variant === 'large' ? "w-12 h-12" : "w-10 h-10"
          )}
          style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}40` }}
        >
          {emoji ? (
            <span className="text-base">{emoji}</span>
          ) : icon ? (
            <span style={{ color: accent }}>{icon}</span>
          ) : null}
        </div>

        {trend && typeof trend === 'object' && (
          <div className={cn(
            "font-mono text-nano font-bold tracking-wider",
            trend.direction === 'up'   && "text-status-success",
            trend.direction === 'down' && "text-status-danger",
            trend.direction === 'neutral' && "text-text-muted"
          )}>
            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'} {trend.value}%
          </div>
        )}
      </div>

      <div>
        <p
          className={cn(
            "font-mono font-bold text-text-primary tracking-tight",
            variant === 'large' ? "text-4xl" : variant === 'compact' || variant === 'minimal' ? "text-2xl" : "text-3xl"
          )}
        >
          {value}
        </p>
        <p className="text-nano font-black text-text-muted uppercase tracking-[0.3em] mt-1">
          {label}
        </p>
        {trend && typeof trend === 'string' && (
          <p className="text-nano font-mono text-text-muted mt-1">{trend}</p>
        )}
      </div>
    </motion.div>
  );
}
