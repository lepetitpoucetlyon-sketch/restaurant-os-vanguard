import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 🎨 Design Tokens - Restaurant OS Foundations
 * Centralized design tokens for the multi-tenant "Zestry Strata".
 */
export const ThemeTokens = {
  colors: {
    // Primary Brand Colors (Industrial Dark)
    brand: {
      primary: "var(--brand-primary, #6366f1)", // Indigo 500
      secondary: "var(--brand-secondary, #4338ca)", // Indigo 700
      accent: "var(--brand-accent, #f59e0b)", // Amber 500
    },
    // Backgrounds
    bg: {
      main: "var(--bg-main, #0f172a)", // Slate 900
      card: "var(--bg-card, #1e293b)", // Slate 800
      surface: "var(--bg-surface, #334155)", // Slate 700
    },
    // Text
    text: {
      primary: "var(--text-primary, #f8fafc)", // Slate 50
      secondary: "var(--text-secondary, #cbd5e1)", // Slate 300
      muted: "var(--text-muted, #94a3b8)", // Slate 400
    },
    // Status
    status: {
      success: "#10b981", // Emerald 500
      error: "#ef4444", // Red 500
      warning: "#f59e0b", // Amber 500
      info: "#3b82f6", // Blue 500
    }
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
  },
  borderRadius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  }
};

export type ThemeTokensType = typeof ThemeTokens;

/**
 * Standard Tailwind CSS class merger
 * @example cn("p-4", isOpen && "bg-blue-500", "text-white")
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
