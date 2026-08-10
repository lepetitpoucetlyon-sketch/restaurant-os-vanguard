/**
 * PrepaieBuilder — Moteur de calcul pré-paie Restaurant OS
 *
 * Source canonique pour les 3 sorties : CSV comptable, Silae API, Merge.dev.
 * Corrige les bugs identifiés dans AccountingReportService :
 *   - Heures sup calculées par SEMAINE (35h seuil), pas en global mensuel
 *   - 25% sur h36–43/sem, 50% sur h44+/sem (Code du travail art. L3121-36)
 *   - Pauses BREAK_START/BREAK_END déduites du temps travaillé
 *   - Majorations HCR : dimanche (+50%), nuit après 21h (+25%), jours fériés (+100%)
 *   - Avantage en nature repas comptabilisé
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { PrepaieRow, PayrollPeriodSummary } from './types';
import type { User } from '@nexus/contracts';
import { TipDistributionService } from '../../effectifs/hr/services/tipDistribution';
import { JsonObject } from "@/shared/types/json";
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { IdGenerator } from '@/lib/utils/IdGenerator';

import type { PlatformVariant } from '@/modules/system';
import { resolveCollectiveAgreement } from '../../conventions';
import {
    MU_TO_EUR,
    splitName,
    isoWeekStart,
    analyseSession,
    weeklyOvertimeBreakdown,
    computeGross,
    extractLeaveDays,
    type ShiftEntry,
    type LeaveRequest,
} from './payrollHelpers';

// ── Export principal ───────────────────────────────────────────────────────────

export const PrepaieBuilder = {
    /**
     * Construit les lignes pré-paie pour tous les employés actifs du tenant
     * sur une période donnée (YYYY-MM).
     */
    async build(tenantId: string, periode: string, variant?: PlatformVariant): Promise<PayrollPeriodSummary> {
        const convention = resolveCollectiveAgreement(variant);
        const startTs = new Date(`${periode}-01T00:00:00Z`).getTime();
        const endDate = new Date(`${periode}-01T00:00:00Z`);
        endDate.setUTCMonth(endDate.getUTCMonth() + 1);
        endDate.setUTCDate(0);
        endDate.setUTCHours(23, 59, 59, 999);
        const endTs = endDate.getTime();

        // ── Requêtes Nexus ─────────────────────────────────────────────────────
        const tenantPath = (coll: string) => Nexus.getTenantPath(coll, tenantId);

        const [usersRaw, entriesRaw, leavesRaw] = await Promise.all([
            Nexus.adapter.query<User>(tenantPath('users')),
            Nexus.adapter.query<ShiftEntry>(tenantPath('shiftEntries'), {
                where: [
                    { field: 'timestamp', operator: '>=', value: new Date(startTs).toISOString() },
                    { field: 'timestamp', operator: '<=', value: new Date(endTs).toISOString() },
                ],
                orderBy: { field: 'timestamp', direction: 'asc' },
            }),
            Nexus.adapter.query<LeaveRequest>(tenantPath('leaveRequests'), {
                where: [{ field: 'status', operator: '==', value: 'approved' }],
            }),
        ]);

        const users   = Array.isArray(usersRaw)   ? usersRaw   : [];
        const entries = Array.isArray(entriesRaw) ? entriesRaw : [];
        const leaves  = Array.isArray(leavesRaw)  ? leavesRaw  : [];

        // ── Regrouper les entrées par employé ──────────────────────────────────
        const entriesByUser = new Map<string, ShiftEntry[]>();
        for (const e of entries) {
            const arr = entriesByUser.get(e.userId) ?? [];
            arr.push(e);
            entriesByUser.set(e.userId, arr);
        }

        const rows: PrepaieRow[] = [];

        for (const user of users) {
            if ((user as { status?: string }).status === 'inactive') continue;

            const entries = (entriesByUser.get(user.id) ?? []).sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            // ── Construire les sessions (CLOCK_IN → CLOCK_OUT avec pauses) ────
            const weekMinutes = new Map<string, number>(); // weekStart → minutes nets
            let nightMin = 0;
            let sundayMin = 0;
            let holidayMin = 0;
            let totalMeals = 0;

            let pendingIn: number | null = null;
            const currentBreaks: Array<{ start: number; end: number }> = [];
            let pendingBreakStart: number | null = null;

            for (const e of entries) {
                const ts = new Date(e.timestamp).getTime();
                switch (e.type) {
                    case 'CLOCK_IN':
                        pendingIn = ts;
                        currentBreaks.length = 0;
                        break;
                    case 'BREAK_START':
                        if (pendingIn !== null) pendingBreakStart = ts;
                        break;
                    case 'BREAK_END':
                        if (pendingBreakStart !== null) {
                            currentBreaks.push({ start: pendingBreakStart, end: ts });
                            pendingBreakStart = null;
                        }
                        break;
                    case 'CLOCK_OUT':
                        if (pendingIn !== null) {
                            const session = analyseSession(pendingIn, ts, [...currentBreaks], convention);
                            const week = isoWeekStart(new Date(pendingIn));
                            weekMinutes.set(week, (weekMinutes.get(week) ?? 0) + session.netMinutes);
                            nightMin += session.nightMinutes;
                            sundayMin += session.sundayMinutes;
                            holidayMin += session.holidayMinutes;
                            totalMeals += session.mealCount;
                            pendingIn = null;
                            currentBreaks.length = 0;
                        }
                        break;
                }
            }

            const { normal, ot25, ot50 } = weeklyOvertimeBreakdown(weekMinutes, convention);
            const hourlyRateEur = (user.hourlyRateInMicrounits ?? 0) / MU_TO_EUR;

            const cpDays  = extractLeaveDays(leaves, user.id, ['paid_leave'],     startTs, endTs);
            const absDays = extractLeaveDays(leaves, user.id, ['sick', 'unpaid'], startTs, endTs);

            const grossEur = computeGross(normal, ot25, ot50, hourlyRateEur, convention);
            const { nom, prenom } = splitName(user.name as string | undefined);

            rows.push({
                userId: user.id,
                matricule: user.id.slice(-8).toUpperCase(),
                nom,
                prenom,
                email: (user as unknown as Record<string, string>).email,
                contrat: (user as unknown as Record<string, string>).contractType ?? 'cdi',
                dateEntree: (user as unknown as Record<string, string>).hireDate,
                heuresNormales: Math.round(normal / 60 * 100) / 100,
                heuresSupP25: Math.round(ot25 / 60 * 100) / 100,
                heuresSupP50: Math.round(ot50 / 60 * 100) / 100,
                heuresDimanche: Math.round(sundayMin / 60 * 100) / 100,
                heuresNuit: Math.round(nightMin / 60 * 100) / 100,
                heuresJoursFeries: Math.round(holidayMin / 60 * 100) / 100,
                nbRepas: totalMeals,
                absencesJours: absDays,
                congesPayesJours: cpDays,
                pourboiresEur: 0,
                tauxHoraireEur: Math.round(hourlyRateEur * 100) / 100,
                salaireBrutEur: Math.round(grossEur * 100) / 100,
                periode,
            });
        }

        const tipPoolsRaw = await TipDistributionService.getByPeriode(tenantId, periode);
        const tipPools = Array.isArray(tipPoolsRaw) ? tipPoolsRaw : [];
        for (const pool of tipPools) {
            for (const share of pool.shares) {
                const row = rows.find(r => r.userId === share.userId);
                if (row) {
                    row.pourboiresEur += Math.round((share.amountInMicrounits / MU_TO_EUR) * 100) / 100;
                }
            }
        }

        const totalBrut = rows.reduce((s, r) => s + r.salaireBrutEur, 0);
        const totalHeures = rows.reduce((s, r) => s + r.heuresNormales + r.heuresSupP25 + r.heuresSupP50, 0);

        return {
            periode,
            tenantId,
            generatedAt: new Date().toISOString(),
            rows,
            totalBrut: Math.round(totalBrut * 100) / 100,
            totalHeures: Math.round(totalHeures * 100) / 100,
        };
    },

    /**
     * Soumet une période de paie pour calcul automatique.
     * Émet `payroll.submitted` → déclenche PayrollAutoCalcHandler.
     */
    async submitPayrollPeriod(
        tenantId: string,
        periode: string,
        employeeCount: number,
        isSimulation = false,
    ): Promise<string> {
        const submissionId = IdGenerator.generateWithPrefix('payroll-sub');
        await NexusEventBus.emitDurable('payroll.submitted', {
            v: 1,
            tenantId,
            period: periode,
            submissionId,
            employeeCount,
            isSimulation,
        });
        return submissionId;
    },

    /**
     * Valide une pré-paie calculée et la transmet au prestataire externe (Silae).
     * Émet `hr.preroll_validated` → déclenche PayrollExportHandler + SilaeExportHandler.
     */
    async validatePayrollPeriod(
        tenantId: string,
        submissionId: string,
        validatedBy: string,
        summary: PayrollPeriodSummary,
    ): Promise<void> {
        await NexusEventBus.emitDurable('hr.preroll_validated', {
            v: 1,
            tenantId,
            periodId: submissionId,
            validatedBy,
            totalEmployees: summary.rows.length,
        });
    },

    /** Sérialise les lignes en CSV UTF-8 BOM (compatible Excel FR). */
    toCsv(summary: PayrollPeriodSummary, mealBenefitEur: number = 4.15): string {
        const BOM = '﻿';
        const SEP = ';';
        const headers = [
            'Matricule', 'Nom', 'Prénom', 'Email', 'Contrat', 'Date entrée',
            'H. normales', 'H. sup +25%', 'H. sup +50%',
            'H. dimanche', 'H. nuit', 'H. jours fériés',
            'Nb repas (AN)', 'Absences (j)', 'CP pris (j)',
            'Pourboires (€)', 'Taux horaire (€)', 'Salaire brut (€)',
        ];

        const escape = (v: unknown) => {
            const s = String(v ?? '').replace(/"/g, '""');
            return s.includes(SEP) || s.includes('\n') ? `"${s}"` : s;
        };

        const toFr = (n: number) => String(n).replace('.', ',');

        const lines = [
            `Période : ${summary.periode}${SEP}Généré le : ${summary.generatedAt.slice(0, 10)}`,
            '',
            headers.map(escape).join(SEP),
            ...summary.rows.map(r => [
                r.matricule, r.nom, r.prenom, r.email ?? '', r.contrat, r.dateEntree ?? '',
                toFr(r.heuresNormales), toFr(r.heuresSupP25), toFr(r.heuresSupP50),
                toFr(r.heuresDimanche), toFr(r.heuresNuit), toFr(r.heuresJoursFeries),
                r.nbRepas, r.absencesJours, r.congesPayesJours,
                toFr(r.pourboiresEur), toFr(r.tauxHoraireEur), toFr(r.salaireBrutEur),
            ].map(escape).join(SEP)),
            '',
            `TOTAL${SEP}${SEP}${SEP}${SEP}${SEP}${SEP}${SEP}${SEP}${SEP}${SEP}${SEP}${SEP}${SEP}${SEP}${SEP}${SEP}${toFr(summary.totalBrut)}`,
            '',
            `Avantage en nature repas : ${mealBenefitEur} € / repas (valeur URSSAF — à vérifier avec votre expert-comptable)`,
            'Ce document est un pré-paie indicatif. La conformité des bulletins de paie relève de la responsabilité de l\'employeur et de son prestataire de paie.',
        ];

        return BOM + lines.join('\n');
    },
};
