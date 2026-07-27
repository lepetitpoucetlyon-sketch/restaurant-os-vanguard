/**
 * AccountingReportService — Grade X
 * P&L, Bilan, and Payroll export logic.
 * PDF generation via jspdf (client-side only).
 * Direct Nexus queries for date-range P&L builds.
 */

import type { JournalEntry } from '@nexus/contracts/finance.types';
import type { User } from '@nexus/contracts';
import type { ShiftEntry } from '@/domain/schemas/hr';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PnLLine {
    accountCode: string;
    accountName: string;
    debitInMicrounits: number;
    creditInMicrounits: number;
    balanceInMicrounits: number;
}

export interface PnLResult {
    revenue: number;          // microunits
    costs: number;            // microunits
    grossMargin: number;      // microunits
    operatingResult: number;  // microunits
    revenueLines: PnLLine[];
    costLines: PnLLine[];
    periodStart: number;
    periodEnd: number;
}

export interface BalanceSheetResult {
    actifLines: PnLLine[];
    passifLines: PnLLine[];
    totalActif: number;
    totalPassif: number;
    asOfDate: number;
}

export interface PayrollRow {
    nom: string;
    prenom: string;
    matricule: string;
    heuresNormales: number;
    heuresSup: number;
    tauxHoraireBrut: number;   // EUR
    salaireBrut: number;       // EUR
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MU_TO_EUR = 1_000_000;
const LEGAL_MONTHLY_HOURS = 151.67;

function microToEur(mu: number): number {
    return mu / MU_TO_EUR;
}

function formatEur(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

// ── Service ───────────────────────────────────────────────────────────────────

export class AccountingReportService {
    /**
     * Build a Profit & Loss report from journalEntries in a date range.
     * Groups debit/credit lines by PCG account prefix:
     *   6xx = charges (costs)
     *   7xx = produits (revenue)
     */
    static async buildPnL(startDate: number, endDate: number, tenantId?: string): Promise<PnLResult> {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const path = tenantId ? `tenants/${tenantId}/journalEntries` : Nexus.getTenantPath('journalEntries');

        const entries = await Nexus.adapter.query<JournalEntry>(path, {
            where: [
                { field: 'date', operator: '>=', value: startDate },
                { field: 'date', operator: '<=', value: endDate },
            ],
            orderBy: { field: 'date', direction: 'asc' },
        });

        const revenueMap = new Map<string, PnLLine>();
        const costMap = new Map<string, PnLLine>();

        for (const entry of entries) {
            for (const line of (entry.lines ?? [])) {
                const code = line.accountCode ?? '';
                const prefix = code.charAt(0);

                // Determine microunit amounts (lines may be in cents; we normalise)
                const debit = (line.debitInCents ?? 0) * 10_000;   // cents → microunits (1 cent = 10 000 µ)
                const credit = (line.creditInCents ?? 0) * 10_000;

                if (prefix === '7') {
                    const existing = revenueMap.get(code) ?? {
                        accountCode: code,
                        accountName: line.accountName ?? code,
                        debitInMicrounits: 0,
                        creditInMicrounits: 0,
                        balanceInMicrounits: 0,
                    };
                    existing.debitInMicrounits += debit;
                    existing.creditInMicrounits += credit;
                    existing.balanceInMicrounits = existing.creditInMicrounits - existing.debitInMicrounits;
                    revenueMap.set(code, existing);
                } else if (prefix === '6') {
                    const existing = costMap.get(code) ?? {
                        accountCode: code,
                        accountName: line.accountName ?? code,
                        debitInMicrounits: 0,
                        creditInMicrounits: 0,
                        balanceInMicrounits: 0,
                    };
                    existing.debitInMicrounits += debit;
                    existing.creditInMicrounits += credit;
                    existing.balanceInMicrounits = existing.debitInMicrounits - existing.creditInMicrounits;
                    costMap.set(code, existing);
                }
            }
        }

        const revenueLines = Array.from(revenueMap.values()).sort((a, b) =>
            a.accountCode.localeCompare(b.accountCode));
        const costLines = Array.from(costMap.values()).sort((a, b) =>
            a.accountCode.localeCompare(b.accountCode));

        const revenue = revenueLines.reduce((s, l) => s + l.balanceInMicrounits, 0);
        const costs = costLines.reduce((s, l) => s + l.balanceInMicrounits, 0);
        const grossMargin = revenue - costs;
        const operatingResult = grossMargin; // simplified (no D&A split)

        return { revenue, costs, grossMargin, operatingResult, revenueLines, costLines, periodStart: startDate, periodEnd: endDate };
    }

    // ── PDF Exports (client-side only) ─────────────────────────────────────────

    static async exportPnLPDF(data: PnLResult): Promise<void> {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();
        const W = doc.internal.pageSize.width;

        // Header
        doc.setFillColor(26, 26, 26);
        doc.rect(0, 0, W, 32, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPTE DE RÉSULTAT', 14, 14);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const period = `Du ${new Date(data.periodStart).toLocaleDateString('fr-FR')} au ${new Date(data.periodEnd).toLocaleDateString('fr-FR')}`;
        doc.text(period, 14, 24);
        doc.text('Restaurant OS Core', W - 14, 24, { align: 'right' });

        // Revenue table
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUITS (comptes 7xx)', 14, 44);

        autoTable(doc, {
            startY: 48,
            head: [['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde']],
            body: data.revenueLines.map(l => [
                l.accountCode,
                l.accountName,
                formatEur(microToEur(l.debitInMicrounits)),
                formatEur(microToEur(l.creditInMicrounits)),
                formatEur(microToEur(l.balanceInMicrounits)),
            ]),
            foot: [['', 'TOTAL PRODUITS', '', '', formatEur(microToEur(data.revenue))]],
            theme: 'grid',
            headStyles: { fillColor: [40, 120, 80], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [220, 240, 220], fontStyle: 'bold' },
            styles: { fontSize: 9 },
        });

        const afterRevenue = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

        // Cost table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('CHARGES (comptes 6xx)', 14, afterRevenue);

        autoTable(doc, {
            startY: afterRevenue + 4,
            head: [['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde']],
            body: data.costLines.map(l => [
                l.accountCode,
                l.accountName,
                formatEur(microToEur(l.debitInMicrounits)),
                formatEur(microToEur(l.creditInMicrounits)),
                formatEur(microToEur(l.balanceInMicrounits)),
            ]),
            foot: [['', 'TOTAL CHARGES', '', '', formatEur(microToEur(data.costs))]],
            theme: 'grid',
            headStyles: { fillColor: [160, 50, 50], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [240, 220, 220], fontStyle: 'bold' },
            styles: { fontSize: 9 },
        });

        const afterCosts = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

        // Result summary
        doc.setFillColor(240, 245, 255);
        doc.roundedRect(14, afterCosts, W - 28, 28, 2, 2, 'FD');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Marge brute :', 20, afterCosts + 9);
        doc.text(formatEur(microToEur(data.grossMargin)), W - 20, afterCosts + 9, { align: 'right' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('RÉSULTAT D\'EXPLOITATION :', 20, afterCosts + 22);
        const resultColor = data.operatingResult >= 0 ? [30, 130, 60] : [180, 40, 40];
        doc.setTextColor(resultColor[0], resultColor[1], resultColor[2]);
        doc.text(formatEur(microToEur(data.operatingResult)), W - 20, afterCosts + 22, { align: 'right' });

        // Footer
        const H = doc.internal.pageSize.height;
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} — Restaurant OS`, 14, H - 10);

        const month = new Date(data.periodStart).toISOString().slice(0, 7);
        doc.save(`PnL_${month}.pdf`);
    }

    static async exportBalanceSheetPDF(data: BalanceSheetResult): Promise<void> {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF({ orientation: 'landscape' });
        const W = doc.internal.pageSize.width;

        // Header
        doc.setFillColor(26, 26, 26);
        doc.rect(0, 0, W, 32, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('BILAN SIMPLIFIÉ', 14, 14);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Au ${new Date(data.asOfDate).toLocaleDateString('fr-FR')}`, 14, 24);

        const midX = W / 2;

        // Actif
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('ACTIF', 14, 44);

        autoTable(doc, {
            startY: 48,
            tableWidth: midX - 20,
            head: [['Compte', 'Libellé', 'Montant']],
            body: data.actifLines.map(l => [
                l.accountCode,
                l.accountName,
                formatEur(microToEur(l.balanceInMicrounits)),
            ]),
            foot: [['', 'TOTAL ACTIF', formatEur(microToEur(data.totalActif))]],
            theme: 'grid',
            headStyles: { fillColor: [30, 80, 160], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [210, 225, 255], fontStyle: 'bold' },
            styles: { fontSize: 9 },
        });

        // Passif
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('PASSIF & CAPITAUX PROPRES', midX + 6, 44);

        autoTable(doc, {
            startY: 48,
            startX: midX + 6,
            tableWidth: midX - 20,
            head: [['Compte', 'Libellé', 'Montant']],
            body: data.passifLines.map(l => [
                l.accountCode,
                l.accountName,
                formatEur(microToEur(l.balanceInMicrounits)),
            ]),
            foot: [['', 'TOTAL PASSIF', formatEur(microToEur(data.totalPassif))]],
            theme: 'grid',
            headStyles: { fillColor: [120, 40, 140], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [240, 210, 255], fontStyle: 'bold' },
            styles: { fontSize: 9 },
        } as Parameters<typeof autoTable>[1] & { startX?: number });

        const H = doc.internal.pageSize.height;
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} — Restaurant OS`, 14, H - 10);

        doc.save(`Bilan_${new Date(data.asOfDate).toISOString().slice(0, 10)}.pdf`);
    }

    /**
     * Build a BalanceSheet snapshot from journal entries up to asOfDate.
     * Groups by PCG class:
     *   Classes 1-5 → Bilan (passif/actif)
     *   1xx, 2xx, 3xx, 4xx, 5xx → actif or passif depending on normal side
     */
    static async buildBalanceSheet(asOfDate: number, tenantId?: string): Promise<BalanceSheetResult> {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const path = tenantId ? `tenants/${tenantId}/journalEntries` : Nexus.getTenantPath('journalEntries');

        const entries = await Nexus.adapter.query<JournalEntry>(path, {
            where: [{ field: 'date', operator: '<=', value: asOfDate }],
            orderBy: { field: 'date', direction: 'asc' },
        });

        const actifMap = new Map<string, PnLLine>();
        const passifMap = new Map<string, PnLLine>();

        // PCG: 1xx (capital/dettes LT) → passif; 2xx (immobilisations) → actif;
        //       3xx (stocks) → actif; 4xx (tiers) → actif/passif mixed;
        //       5xx (trésorerie) → actif
        const isActif = (code: string) => {
            const first = code.charAt(0);
            return first === '2' || first === '3' || first === '4' || first === '5';
        };

        for (const entry of entries) {
            for (const line of (entry.lines ?? [])) {
                const code = line.accountCode ?? '';
                const first = code.charAt(0);
                if (!['1', '2', '3', '4', '5'].includes(first)) continue;

                const debit = (line.debitInCents ?? 0) * 10_000;
                const credit = (line.creditInCents ?? 0) * 10_000;

                const map = isActif(code) ? actifMap : passifMap;
                const existing = map.get(code) ?? {
                    accountCode: code,
                    accountName: line.accountName ?? code,
                    debitInMicrounits: 0,
                    creditInMicrounits: 0,
                    balanceInMicrounits: 0,
                };
                existing.debitInMicrounits += debit;
                existing.creditInMicrounits += credit;
                // Actif → normal debit; Passif → normal credit
                existing.balanceInMicrounits = isActif(code)
                    ? existing.debitInMicrounits - existing.creditInMicrounits
                    : existing.creditInMicrounits - existing.debitInMicrounits;
                map.set(code, existing);
            }
        }

        const actifLines = Array.from(actifMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
        const passifLines = Array.from(passifMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));

        return {
            actifLines,
            passifLines,
            totalActif: actifLines.reduce((s, l) => s + l.balanceInMicrounits, 0),
            totalPassif: passifLines.reduce((s, l) => s + l.balanceInMicrounits, 0),
            asOfDate,
        };
    }

    // ── Payroll CSV Export ─────────────────────────────────────────────────────

    /**
     * @deprecated Utiliser PrepaieBuilder.build() à la place.
     * Ce calcul ignore les pauses, le seuil 35h hebdo (Code du Travail),
     * la distinction h36-43 (+25%) vs h44+ (+50%), les primes HCR
     * (dimanche, nuit, jours fériés), et les absences / congés payés.
     * Voir src/lib/payroll/PrepaieBuilder.ts pour le moteur correct.
     *
     * Conservé uniquement pour rétrocompatibilité avec FacturXDownloadButton.
     * Ne pas utiliser pour un export réel transmis à un prestataire paie.
     */
    static async buildPayrollRows(month: string): Promise<PayrollRow[]> {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');

        const startTs = new Date(`${month}-01T00:00:00Z`).getTime();
        const endTs = new Date(`${month}-01T00:00:00Z`);
        endTs.setMonth(endTs.getMonth() + 1);
        endTs.setDate(0); // last day of month
        endTs.setHours(23, 59, 59, 999);
        const endTimestamp = endTs.getTime();

        const [usersRaw, shiftsRaw] = await Promise.all([
            Nexus.adapter.query<User>('users'),
            Nexus.adapter.query<ShiftEntry>('shiftEntries', {
                where: [
                    { field: 'timestamp', operator: '>=', value: new Date(startTs).toISOString() },
                    { field: 'timestamp', operator: '<=', value: new Date(endTimestamp).toISOString() },
                ],
                orderBy: { field: 'timestamp', direction: 'asc' },
            }),
        ]);

        // Group shifts by userId
        const shiftsByUser = new Map<string, ShiftEntry[]>();
        for (const shift of shiftsRaw) {
            const arr = shiftsByUser.get(shift.userId) ?? [];
            arr.push(shift);
            shiftsByUser.set(shift.userId, arr);
        }

        const rows: PayrollRow[] = [];

        for (const user of usersRaw) {
            const userShifts = shiftsByUser.get(user.id) ?? [];
            if (userShifts.length === 0 && (user.hourlyRateInMicrounits ?? 0) === 0) continue;

            // Pair CLOCK_IN with next CLOCK_OUT
            const sorted = [...userShifts].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            let totalMinutes = 0;
            let pendingIn: number | null = null;

            for (const shift of sorted) {
                const ts = new Date(shift.timestamp).getTime();
                if (shift.type === 'CLOCK_IN') {
                    pendingIn = ts;
                } else if (shift.type === 'CLOCK_OUT' && pendingIn !== null) {
                    totalMinutes += (ts - pendingIn) / 60_000;
                    pendingIn = null;
                }
            }

            const totalHours = totalMinutes / 60;
            const normalHours = Math.min(totalHours, LEGAL_MONTHLY_HOURS);
            const overtimeHours = Math.max(0, totalHours - LEGAL_MONTHLY_HOURS);

            const hourlyRateMu = user.hourlyRateInMicrounits ?? 0;
            const hourlyRateEur = hourlyRateMu / MU_TO_EUR;

            // APPROXIMATION : taux unique 25% — ne pas utiliser pour paie réelle
            // (pauses non déduites, seuil 35h/sem ignoré, primes HCR absentes)
            const grossAmount =
                normalHours * hourlyRateEur + overtimeHours * hourlyRateEur * 1.25;

            const nameParts = (user.name ?? '').split(' ');
            const nom = nameParts[0] ?? '';
            const prenom = nameParts.slice(1).join(' ') || '';

            rows.push({
                nom,
                prenom,
                matricule: user.id.slice(-8).toUpperCase(),
                heuresNormales: Math.round(normalHours * 100) / 100,
                heuresSup: Math.round(overtimeHours * 100) / 100,
                tauxHoraireBrut: Math.round(hourlyRateEur * 100) / 100,
                salaireBrut: Math.round(grossAmount * 100) / 100,
            });
        }

        return rows;
    }

    // ── Factur-X / UBL Export (fin-9) ─────────────────────────────────────────

    /**
     * Génère le XML Factur-X MINIMUM (EN16931) pour une JournalEntry donnée.
     *
     * Les données vendeur/acheteur sont lues depuis la JournalEntry (description,
     * referenceId, etc.). Pour une intégration plus riche, passer les infos SIRET
     * via le contexte tenant.
     *
     * Retourne la chaîne XML prête à être téléchargée ou embarquée dans un PDF.
     */
    static async exportFacturX(journalEntryId: string): Promise<string> {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const { FacturXGenerator } = await import('@/modules/finance/documents/FacturXGenerator');

        const entry = await Nexus.adapter.get<JournalEntry>(`journalEntries/${journalEntryId}`);
        if (!entry) throw new Error(`JournalEntry introuvable : ${journalEntryId}`);

        // Résoudre la date de l'écriture en YYYY-MM-DD
        const entryDate = (() => {
            if (typeof entry.date === 'string') return entry.date.slice(0, 10);
            if (typeof entry.date === 'number') return new Date(entry.date).toISOString().slice(0, 10);
            if (entry.date instanceof Date) return entry.date.toISOString().slice(0, 10);
            return new Date().toISOString().slice(0, 10);
        })();

        // Construire les lignes Factur-X depuis les lignes de l'écriture (comptes 7xx = produit)
        // Les montants stockés sont en cents → conversion en euros pour le XML externe
        const facturXLines = (entry.lines ?? [])
            .filter(l => (l.accountCode ?? '').startsWith('7'))
            .map(l => ({
                description: l.description || l.accountName || l.accountCode,
                quantity: 1,
                unitPrice: (l.creditInCents ?? 0) / 100,
                vatRate: 0.10, // taux restauration par défaut — affiner via accountCode si besoin
            }));

        // Si aucune ligne produit, on crée une ligne synthétique à partir du montant total
        if (facturXLines.length === 0) {
            const totalCents = entry.amountInCents ?? 0;
            facturXLines.push({
                description: entry.description || 'Prestation',
                quantity: 1,
                unitPrice: totalCents / 100,
                vatRate: 0.10,
            });
        }

        const generator = new FacturXGenerator();
        const xml = generator.generateXML({
            invoiceNumber: entry.pieceNumber || entry.id,
            issueDate: entryDate,
            seller: {
                name: 'Restaurant OS Core',
                siret: '00000000000000', // à surcharger via config tenant
                address: 'France',
            },
            buyer: {
                name: entry.description || 'Client',
                address: 'France',
            },
            lines: facturXLines,
        });

        return xml;
    }

    /**
     * Generate and trigger browser download of payroll CSV.
     */
    static async exportPayrollCSV(month: string): Promise<void> {
        const rows = await AccountingReportService.buildPayrollRows(month);

        const header = 'NOM;PRENOM;MATRICULE;HEURES_NORMALES;HEURES_SUP;TAUX_HORAIRE_BRUT;SALAIRE_BRUT';
        const lines = rows.map(r =>
            [
                r.nom,
                r.prenom,
                r.matricule,
                r.heuresNormales.toFixed(2),
                r.heuresSup.toFixed(2),
                r.tauxHoraireBrut.toFixed(2),
                r.salaireBrut.toFixed(2),
            ].join(';')
        );

        const csv = [header, ...lines].join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paie_${month}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
