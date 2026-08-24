/**
 * TreasuryCalculator — position de trésorerie d'UN restaurant depuis les écritures Nexus.
 *
 * (À ne pas confondre avec TreasuryEngine, qui consolide les finances de la FLOTTE SaaS.)
 *
 * Reflète le plan comptable (PCG) exactement comme AccountingReportService.buildPnL :
 *   53x  → caisse              (actif, solde débiteur)
 *   512x → banque              (actif, solde débiteur)
 *   411x → créances clients    (ce que les clients nous doivent, solde débiteur)
 *   401x → dettes fournisseurs (ce que nous devons, solde créditeur)
 *
 * Les lignes d'écriture sont stockées en centimes (`debitInCents`/`creditInCents`) —
 * normalisées ici en microunits (×1000), cohérent avec buildPnL.
 *
 * Fonction pure : aucune I/O, la date « maintenant » est injectée pour rester déterministe/testable.
 */

import type { TreasurySnapshot, TreasuryTrendPoint } from '../types';
import type { JournalLine } from '../domain/schemas/finance';

const DAY_MS = 86_400_000;
// 1 centime = 0,01 € = 10 000 microunits (1 € = 1 000 000 µ).
// Cohérent avec FinancialNexusBridge : amountInCents = microunits / 10 000.
const CENTS_TO_MICRO = 10_000;

/**
 * Entrée minimale attendue par le moteur — type STRUCTUREL découplé des variantes
 * de JournalEntry (schéma brandé vs contrats). Le moteur ne lit que ces champs.
 */
export interface TreasuryEntryInput {
    type?: string;
    date?: number | string | Date;
    amountInMicrounits?: number;
    lines?: readonly JournalLine[] | readonly unknown[];
}

/** Normalise une date d'écriture (number | string | Date) en timestamp ms. */
function toTimestamp(date: unknown): number {
    if (typeof date === "number") return date;
    if (date instanceof Date) return date.getTime();
    if (typeof date === "string") {
        const parsed = Date.parse(date);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

/** Début de journée (minuit local) pour un timestamp donné. */
function startOfDay(ts: number): number {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

/**
 * Calcule l'instantané de trésorerie.
 * @param entries   Écritures du grand livre (déjà chargées par le provider).
 * @param now       Timestamp « maintenant » (défaut Date.now()) — injecté pour les tests.
 * @param trendDays Fenêtre de la courbe de flux (défaut 14 jours).
 */
export function computeTreasury(
    entries: readonly TreasuryEntryInput[],
    now: number = Date.now(),
    trendDays = 14,
): TreasurySnapshot {
    let cashOnHand = 0;
    let bankBalance = 0;
    let receivables = 0;
    let payables = 0;

    for (const entry of entries) {
        const lines = (entry.lines ?? []) as readonly JournalLine[];
        for (const line of lines) {
            const code = line.accountCode ?? "";
            if (!code) continue;
            const debit = line.debitInMicrounits ?? ((line.debitInCents ?? 0) * CENTS_TO_MICRO);
            const credit = line.creditInMicrounits ?? ((line.creditInCents ?? 0) * CENTS_TO_MICRO);

            if (code.startsWith("53")) {
                cashOnHand += debit - credit;            // actif : le débit augmente le solde
            } else if (code.startsWith("512")) {
                bankBalance += debit - credit;           // actif : le débit augmente le solde
            } else if (code.startsWith("411")) {
                receivables += debit - credit;           // créance : débit = dû par le client
            } else if (code.startsWith("401")) {
                payables += credit - debit;              // dette : crédit = dû au fournisseur
            }
        }
    }

    const netCashPosition = cashOnHand + bankBalance;

    // ── Courbe de flux journalier sur `trendDays` jours ──────────────────────
    // Flux net = produits (type revenue) − charges (type expense), au niveau écriture.
    const today = startOfDay(now);
    const buckets = new Map<number, number>();
    for (let i = trendDays - 1; i >= 0; i--) {
        buckets.set(today - i * DAY_MS, 0);
    }

    for (const entry of entries) {
        const day = startOfDay(toTimestamp(entry.date));
        if (!buckets.has(day)) continue;
        const amount = Number(entry.amountInMicrounits || 0);
        const signed =
            entry.type === "revenue" ? amount
            : entry.type === "expense" ? -amount
            : 0;
        buckets.set(day, (buckets.get(day) ?? 0) + signed);
    }

    const cashFlowTrend: TreasuryTrendPoint[] = Array.from(buckets.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([date, netInMicrounits]) => ({ date, netInMicrounits }));

    // ── Prévision 30 jours : position actuelle + flux journalier moyen × 30 ───
    const totalNet = cashFlowTrend.reduce((s, p) => s + p.netInMicrounits, 0);
    const avgDailyNet = cashFlowTrend.length > 0 ? totalNet / cashFlowTrend.length : 0;
    const forecast30Days = netCashPosition + avgDailyNet * 30;

    return {
        cashOnHandInMicrounits: Math.round(cashOnHand),
        bankBalanceInMicrounits: Math.round(bankBalance),
        pendingReceivablesInMicrounits: Math.round(receivables),
        pendingPayablesInMicrounits: Math.round(payables),
        netCashPositionInMicrounits: Math.round(netCashPosition),
        forecast30DaysInMicrounits: Math.round(forecast30Days),
        cashFlowTrend,
    };
}
