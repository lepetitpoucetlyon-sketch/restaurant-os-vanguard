// @ts-nocheck
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formate une date en format relatif ou absolu selon la proximité.
 * 
 * @example
 * formatSmartDate(new Date()) // "Aujourd'hui, 14:30"
 * formatSmartDate(yesterday) // "Hier, 18:45"
 * formatSmartDate(lastWeek) // "Lun. 12 janv."
 */
export function formatSmartDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;

    if (isToday(d)) {
        return `Aujourd'hui, ${format(d, "HH:mm")}`;
    }
    if (isTomorrow(d)) {
        return `Demain, ${format(d, "HH:mm")}`;
    }
    if (isYesterday(d)) {
        return `Hier, ${format(d, "HH:mm")}`;
    }

    return format(d, "EEE d MMM", { locale: fr });
}

/**
 * Formate une date en format relatif ("il y a 5 minutes").
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

/**
 * Formate un montant en euros.
 * 
 * @param amountInCents Montant en CENTIMES d'euro (integer)
 */
export function formatCurrency(
    amountInCents: number,
    options: { compact?: boolean; decimals?: number } = {}
): string {
    const { compact = false, decimals = 2 } = options;
    const amountInEuros = amountInCents / 100;

    if (compact && Math.abs(amountInEuros) >= 1000) {
        const formatter = new Intl.NumberFormat("fr-FR", {
            notation: "compact",
            compactDisplay: "short",
            style: "currency",
            currency: "EUR",
        });
        return formatter.format(amountInEuros);
    }

    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amountInEuros);
}

/**
 * Formate un nombre avec séparateurs de milliers.
 * 
 * @example
 * formatNumber(1234567) // "1 234 567"
 */
export function formatNumber(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Formate un pourcentage.
 * 
 * @example
 * formatPercent(0.1234) // "12,34 %"
 * formatPercent(0.1234, { decimals: 0 }) // "12 %"
 */
export function formatPercent(
    value: number,
    options: { decimals?: number; showSign?: boolean } = {}
): string {
    const { decimals = 1, showSign = false } = options;
    const formatted = new Intl.NumberFormat("fr-FR", {
        style: "percent",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);

    if (showSign && value > 0) {
        return `+${formatted}`;
    }
    return formatted;
}

/**
 * Formate un numéro de téléphone français.
 * 
 * @example
 * formatPhone("0612345678") // "06 12 34 56 78"
 */
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) return phone;
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
}

/**
 * Tronque un texte à une longueur donnée.
 * 
 * @example
 * truncate("Lorem ipsum dolor sit amet", 20) // "Lorem ipsum dolor..."
 */
export function truncate(text: string, maxLength: number, suffix: string = "..."): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalise la première lettre d'une chaîne.
 */
export function capitalize(text: string): string {
    if (!text) return "";
    return (text || '').charAt(0).toUpperCase() + (text || '').slice(1).toLowerCase();
}

/**
 * Génère les initiales d'un nom.
 * 
 * @example
 * getInitials("Jean Dupont") // "JD"
 */
export function getInitials(name: string, maxLength: number = 2): string {
    if (!name) return "";
    return name
        .split(" ")
        .map((word) => (word || '').charAt(0).toUpperCase())
        .slice(0, maxLength)
        .join("");
}

/**
 * Formate une durée en minutes en format lisible.
 * 
 * @example
 * formatDuration(125) // "2h 05min"
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${String(mins).padStart(2, "0")}min` : `${hours}h`;
}
