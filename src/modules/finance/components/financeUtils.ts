import type { JournalEntry, JournalLine } from "@nexus/contracts";

/**
 * 💶 Finance — types & helpers purs
 *
 * Extraits de finance/page.tsx (dette-4) pour alléger le god file (819 lignes)
 * et isoler la logique pure (TVA, formatage) — testable sans React.
 */

// ── Tab types ─────────────────────────────────────────────────────────────────

export type FinanceTab = "accounting" | "billing" | "bank" | "audit";

// ── Local bank account shape (from bankAccounts/ Nexus collection) ─────────

export interface BankAccount {
    id: string;
    label: string;
    bankName?: string;
    /** Balance in cents */
    balance: number;
    currency?: string;
    lastUpdate?: string;
}

// ── TVA grouping ──────────────────────────────────────────────────────────────

export interface TvaGroup {
    rate: string;
    label: string;
    htInCents: number;
}

/**
 * Groups journal entry lines by PCG account prefix to build the TVA recap.
 * 5.5%: compte 706 (alimentaire/snacking)
 * 10% : comptes 707-708 (restauration sur place/à emporter)
 * 20% : comptes 701-703 (alcools, boissons premium)
 */
export function computeTVABreakdown(entries: JournalEntry[]): TvaGroup[] {
    const map: Record<string, number> = { "5.5%": 0, "10%": 0, "20%": 0 };

    for (const entry of entries) {
        for (const line of ((entry.lines ?? []) as JournalLine[])) {
            const code = line.accountCode ?? "";
            const credit = line.creditInCents ?? 0;
            if (code.startsWith("706")) {
                map["5.5%"] += credit;
            } else if (code.startsWith("707") || code.startsWith("708")) {
                map["10%"] += credit;
            } else if (
                code.startsWith("701") ||
                code.startsWith("702") ||
                code.startsWith("703")
            ) {
                map["20%"] += credit;
            }
        }
    }

    return [
        { rate: "5,5 %", label: "CA alimentaire (snacking, épicerie)", htInCents: map["5.5%"] },
        { rate: "10 %", label: "Restauration sur place / à emporter", htInCents: map["10%"] },
        { rate: "20 %", label: "Alcools & boissons premium", htInCents: map["20%"] },
    ];
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatEur(value: number): string {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value ?? 0);
}

export function centsToEur(cents: number): number {
    return cents / 100;
}

export function muToEur(mu: number): number {
    return mu / 1_000_000;
}
