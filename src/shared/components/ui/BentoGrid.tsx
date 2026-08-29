'use client';

import { cn } from '@/lib/ui.foundations';
import type { ReactNode } from 'react';

/**
 * 🧩 BentoGrid — Asymmetric layout primitive.
 *
 * Implements Taste-Skill §4.7 Bento Cell Count Rule:
 *   "A bento grid has EXACTLY as many cells as you have content for."
 *
 * Also enforces Bento Background Diversity (§4.7):
 *   "At least 2-3 cells need real visual variation."
 *
 * Layouts:
 *   - hero-2col: 1 hero (col-span-2) + 2 regular = 3 cells
 *   - hero-3col: 1 hero (col-span-2, row-span-2) + 3 regular = 4 cells
 *   - asymmetric-4: 2 wide + 2 narrow = 4 cells
 *   - asymmetric-5: 1 hero + 2 medium + 2 narrow = 5 cells
 *   - masonry-6: 3+3 with alternating heights = 6 cells
 *   - full-hero: 1 full-width hero = 1 cell
 */

export type BentoLayout =
  | 'hero-2col'
  | 'hero-3col'
  | 'asymmetric-4'
  | 'asymmetric-5'
  | 'masonry-6'
  | 'full-hero';

const GRID_CLASSES: Record<BentoLayout, string> = {
  'hero-2col':    'grid grid-cols-1 lg:grid-cols-3 gap-[var(--density-gap-lg,1rem)]',
  'hero-3col':    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--density-gap-lg,1rem)]',
  'asymmetric-4': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[var(--density-gap-lg,1rem)]',
  'asymmetric-5': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-[var(--density-gap-lg,1rem)]',
  'masonry-6':    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--density-gap-lg,1rem)]',
  'full-hero':    'grid grid-cols-1 gap-[var(--density-gap-lg,1rem)]',
};

export interface BentoGridProps {
  layout: BentoLayout;
  children: ReactNode;
  className?: string;
}

/**
 * BentoGrid container. Children are automatically placed.
 * For hero layouts, the FIRST child occupies the hero cell (span-2).
 */
export function BentoGrid({ layout, children, className }: BentoGridProps) {
  return (
    <div className={cn(GRID_CLASSES[layout], className)}>
      {children}
    </div>
  );
}

/**
 * BentoCell — Wraps a child in the bento grid.
 * Use `span` to control how many columns this cell occupies.
 */
export interface BentoCellProps {
  children: ReactNode;
  /** Column span at lg breakpoint (default: 1) */
  span?: 1 | 2 | 3;
  /** Row span (default: 1) */
  rowSpan?: 1 | 2;
  className?: string;
}

const SPAN_CLASSES: Record<number, string> = {
  1: '',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
};

const ROW_SPAN_CLASSES: Record<number, string> = {
  1: '',
  2: 'lg:row-span-2',
};

export function BentoCell({ children, span = 1, rowSpan = 1, className }: BentoCellProps) {
  return (
    <div className={cn(
      SPAN_CLASSES[span],
      ROW_SPAN_CLASSES[rowSpan],
      className,
    )}>
      {children}
    </div>
  );
}
