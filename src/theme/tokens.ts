// @ts-nocheck
/**
 * RESTAURANT OS - GRADE VI THEME TOKENS
 */

export const ThemeTokens = {
    colors: {
        brand: {
            primary: "var(--brand-primary)",
            secondary: "var(--brand-secondary)",
            accent: "#C5A059", // Default Gold
        },
        bg: {
            main: "#F8F7F2",
            card: "#FFFFFF",
        },
        text: {
            primary: "#1C1C1C",
            secondary: "#525252",
        }
    },
    shadows: {
        premium: "0 8px 32px rgba(0,0,0,0.5)",
    },
    radius: {
        none: "0px",
        small: "4px",
        medium: "12px",
        large: "24px",
    }
};

export type ThemeTokensType = typeof ThemeTokens;
