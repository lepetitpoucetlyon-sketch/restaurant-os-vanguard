/**
 * AccountingReportService — Grade X
 * Thin orchestrator: delegates P&L and BalanceSheet to dedicated modules.
 * Retains: Payroll, Factur-X, and backward-compat static wrappers.
 */

import type { User } from '@nexus/contracts';
import type { ShiftEntry } from '@/domain/schemas/hr';
import type { PnLResult, BalanceSheetResult, PayrollRow } from './accounting-types';
import { MU_TO_EUR, LEGAL_MONTHLY_HOURS } from './accounting-types';
import { buildPnL, exportPnLPDF } from './pnl-report';
import { buildBalanceSheet, exportBalanceSheetPDF } from './balance-sheet-report';

export type { PnLLine, PnLResult, BalanceSheetResult, PayrollRow } from './accounting-types';

export class AccountingReportService {
    // ── Delegated to pnl-report.ts ─────────────────────────────────────────────
    static async buildPnL(startDate: number, endDate: number, tenantId?: string): Promise<PnLResult> {
        return buildPnL(startDate, endDate, tenantId);
    }
    static async exportPnLPDF(data: PnLResult): Promise<void> {
        return exportPnLPDF(data);
    }

    // ── Delegated to balance-sheet-report.ts ───────────────────────────────────
    static async buildBalanceSheet(asOfDate: number, tenantId?: string): Promise<BalanceSheetResult> {
        return buildBalanceSheet(asOfDate, tenantId);
    }
    static async exportBalanceSheetPDF(data: BalanceSheetResult): Promise<void> {
        return exportBalanceSheetPDF(data);
    }

    // ── Payroll CSV Export ─────────────────────────────────────────────────────

    /**
     * @deprecated Utiliser PrepaieBuilder.build() à la place.
     * Conservé uniquement pour rétrocompatibilité avec FacturXDownloadButton.
     */
    static async buildPayrollRows(month: string): Promise<PayrollRow[]> {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');

        const startTs = new Date(`${month}-01T00:00:00Z`).getTime();
        const endTs = new Date(`${month}-01T00:00:00Z`);
        endTs.setMonth(endTs.getMonth() + 1);
        endTs.setDate(0);
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

            const totalHours    = totalMinutes / 60;
            const normalHours   = Math.min(totalHours, LEGAL_MONTHLY_HOURS);
            const overtimeHours = Math.max(0, totalHours - LEGAL_MONTHLY_HOURS);
            const hourlyRateEur = (user.hourlyRateInMicrounits ?? 0) / MU_TO_EUR;

            // APPROXIMATION : taux unique 25% — ne pas utiliser pour paie réelle
            const grossAmount = normalHours * hourlyRateEur + overtimeHours * hourlyRateEur * 1.25;

            const nameParts = (user.name ?? '').split(' ');
            rows.push({
                nom:    nameParts[0] ?? '',
                prenom: nameParts.slice(1).join(' ') || '',
                matricule:       user.id.slice(-8).toUpperCase(),
                heuresNormales:  Math.round(normalHours   * 100) / 100,
                heuresSup:       Math.round(overtimeHours * 100) / 100,
                tauxHoraireBrut: Math.round(hourlyRateEur * 100) / 100,
                salaireBrut:     Math.round(grossAmount   * 100) / 100,
            });
        }

        return rows;
    }

    static async exportPayrollCSV(month: string): Promise<void> {
        const rows = await AccountingReportService.buildPayrollRows(month);

        const header = 'NOM;PRENOM;MATRICULE;HEURES_NORMALES;HEURES_SUP;TAUX_HORAIRE_BRUT;SALAIRE_BRUT';
        const lines  = rows.map(r =>
            [r.nom, r.prenom, r.matricule, r.heuresNormales.toFixed(2), r.heuresSup.toFixed(2), r.tauxHoraireBrut.toFixed(2), r.salaireBrut.toFixed(2)].join(';')
        );

        const csv  = [header, ...lines].join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `paie_${month}.csv`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Factur-X / UBL Export ──────────────────────────────────────────────────

    static async exportFacturX(journalEntryId: string): Promise<string> {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const { FacturXGenerator } = await import('@/modules/finance/documents/FacturXGenerator');

        const entry = await Nexus.adapter.get<import('@nexus/contracts/finance.types').JournalEntry>(`journalEntries/${journalEntryId}`);
        if (!entry) throw new Error(`JournalEntry introuvable : ${journalEntryId}`);

        const entryDate = (() => {
            if (typeof entry.date === 'string') return entry.date.slice(0, 10);
            if (typeof entry.date === 'number') return new Date(entry.date).toISOString().slice(0, 10);
            if (entry.date instanceof Date) return entry.date.toISOString().slice(0, 10);
            return new Date().toISOString().slice(0, 10);
        })();

        const facturXLines = (entry.lines ?? [])
            .filter(l => (l.accountCode ?? '').startsWith('7'))
            .map(l => ({
                description: l.description || l.accountName || l.accountCode,
                quantity: 1,
                unitPrice: (l.creditInCents ?? 0) / 100,
                vatRate: 0.10,
            }));

        if (facturXLines.length === 0) {
            facturXLines.push({
                description: entry.description || 'Prestation',
                quantity: 1,
                unitPrice: (entry.amountInCents ?? 0) / 100,
                vatRate: 0.10,
            });
        }

        const generator = new FacturXGenerator();
        return generator.generateXML({
            invoiceNumber: entry.pieceNumber || entry.id,
            issueDate: entryDate,
            seller: { name: 'Restaurant OS Core', siret: '00000000000000', address: 'France' },
            buyer:  { name: entry.description || 'Client', address: 'France' },
            lines: facturXLines,
        });
    }
}
