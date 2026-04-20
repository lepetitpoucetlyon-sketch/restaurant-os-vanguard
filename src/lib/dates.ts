// @ts-nocheck
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

/**
 * Format a date to French locale
 * @example formatDate(new Date()) => "29 Déc 2025"
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'd MMM yyyy', { locale: fr });
}

/**
 * Format a date to full French locale
 * @example formatDateFull(new Date()) => "Lundi 29 Décembre 2025"
 */
export function formatDateFull(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'EEEE d MMMM yyyy', { locale: fr });
}

/**
 * Format time
 * @example formatTime(new Date()) => "14:30"
 */
export function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'HH:mm', { locale: fr });
}
