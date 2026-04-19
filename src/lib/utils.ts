import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// ──────────────────────────────────────────────────────────────
// Re-exports — Source unique de vérité pour le formatage
// ──────────────────────────────────────────────────────────────
// Ces fonctions étaient dupliquées ici. Elles vivent désormais
// dans leurs fichiers canoniques. On les re-exporte pour
// compatibilité avec les imports existants.
// ──────────────────────────────────────────────────────────────

export { formatCurrency, formatPercent, formatNumber, formatPhone, truncate, capitalize, getInitials, formatDuration } from './formatters';
export { formatDate, formatDateFull, formatTime } from './dates';
export { generateId } from './helpers';

