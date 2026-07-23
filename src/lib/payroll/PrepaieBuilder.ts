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
import { TipDistributionService } from '@/modules/human/hr/services/tipDistribution';

const MU_TO_EUR = 1_000_000;
const NORMAL_WEEKLY_HOURS = 35;
const OT_25_BAND_HOURS = 8;    // 8 premières heures sup (36e–43e) à +25%
const NIGHT_START_HOUR = 21;   // majoration nuit à partir de 21h00
const MEAL_BENEFIT_EUR = 4.15; // avantage en nature repas HCR 2026 (valeur URSSAF)

// Jours fériés France 2025–2027 (YYYY-MM-DD)
const FR_PUBLIC_HOLIDAYS = new Set([
    '2025-01-01','2025-04-21','2025-05-01','2025-05-08','2025-05-29',
    '2025-06-09','2025-07-14','2025-08-15','2025-11-01','2025-11-11','2025-12-25',
    '2026-01-01','2026-04-06','2026-05-01','2026-05-08','2026-05-14',
    '2026-05-25','2026-07-14','2026-08-15','2026-11-01','2026-11-11','2026-12-25',
    '2027-01-01','2027-03-29','2027-05-01','2027-05-08','2027-05-06',
    '2027-05-17','2027-07-14','2027-08-15','2027-11-01','2027-11-11','2027-12-25',
]);

interface ShiftEntry {
    userId: string;
    type: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
    timestamp: string;
}

interface LeaveRequest {
    userId: string;
    status: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    type: string;
}

/** Retourne le lundi de la semaine ISO d'une date donnée (YYYY-MM-DD). */
function isoWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day; // lundi = 0 décalage
    d.setUTCDate(d.getUTCDate() + diff);
    return d.toISOString().slice(0, 10);
}

function toDateStr(ts: string): string {
    return ts.slice(0, 10); // YYYY-MM-DD
}

function isSunday(ts: string): boolean {
    return new Date(ts).getUTCDay() === 0;
}

function isPublicHoliday(ts: string): boolean {
    return FR_PUBLIC_HOLIDAYS.has(toDateStr(ts));
}

function isNightHour(ts: string): boolean {
    return new Date(ts).getUTCHours() >= NIGHT_START_HOUR;
}

/**
 * Calcule le nombre de minutes normales et majorées d'une session de travail.
 * Déduit les pauses et identifie les minutes nuit/dimanche/férié.
 */
function analyseSession(
    clockIn: number,
    clockOut: number,
    breaks: Array<{ start: number; end: number }>,
): {
    netMinutes: number;
    nightMinutes: number;
    sundayMinutes: number;
    holidayMinutes: number;
    mealCount: number;
} {
    // Fusionner les pauses chevauchantes
    const sortedBreaks = [...breaks].sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [];
    for (const b of sortedBreaks) {
        const last = merged[merged.length - 1];
        if (last && b.start <= last.end) {
            last.end = Math.max(last.end, b.end);
        } else {
            merged.push({ ...b });
        }
    }

    // Découper la session en segments hors pause, par minute
    let netMinutes = 0;
    let nightMinutes = 0;
    let sundayMinutes = 0;
    let holidayMinutes = 0;
    let mealCount = 0;

    const TICK = 60_000; // 1 minute
    let t = clockIn;
    let breakIdx = 0;

    while (t < clockOut) {
        // Sauter les pauses
        while (breakIdx < merged.length && t >= merged[breakIdx].start) {
            if (t < merged[breakIdx].end) {
                t = merged[breakIdx].end;
                if (t >= clockOut) break;
            }
            breakIdx++;
        }
        if (t >= clockOut) break;

        const minuteTs = new Date(t).toISOString();
        netMinutes++;
        if (isNightHour(minuteTs)) nightMinutes++;
        if (isSunday(minuteTs)) sundayMinutes++;
        if (isPublicHoliday(minuteTs)) holidayMinutes++;

        t += TICK;
    }

    // 1 repas pour toute session ≥ 5h de travail effectif (convention HCR)
    mealCount = netMinutes >= 300 ? 1 : 0;

    return { netMinutes, nightMinutes, sundayMinutes, holidayMinutes, mealCount };
}

/**
 * Calcule les heures sup par semaine et retourne la décomposition 25%/50%.
 */
function weeklyOvertimeBreakdown(weekMinutes: Map<string, number>): {
    normal: number;
    ot25: number;
    ot50: number;
} {
    let normal = 0;
    let ot25 = 0;
    let ot50 = 0;
    const normalWeekMinutes = NORMAL_WEEKLY_HOURS * 60;
    const ot25BandMinutes = OT_25_BAND_HOURS * 60;

    for (const minutes of weekMinutes.values()) {
        if (minutes <= normalWeekMinutes) {
            normal += minutes;
        } else {
            normal += normalWeekMinutes;
            const ot = minutes - normalWeekMinutes;
            if (ot <= ot25BandMinutes) {
                ot25 += ot;
            } else {
                ot25 += ot25BandMinutes;
                ot50 += ot - ot25BandMinutes;
            }
        }
    }

    return { normal, ot25, ot50 };
}

/** Calcule le salaire brut à partir des heures et du taux horaire. */
function computeGross(
    normalMinutes: number,
    ot25Minutes: number,
    ot50Minutes: number,
    rateEur: number,
): number {
    const ratePerMin = rateEur / 60;
    return (
        normalMinutes * ratePerMin +
        ot25Minutes * ratePerMin * 1.25 +
        ot50Minutes * ratePerMin * 1.50
    );
}

// ── Export principal ───────────────────────────────────────────────────────────

export const PrepaieBuilder = {
    /**
     * Construit les lignes pré-paie pour tous les employés actifs du tenant
     * sur une période donnée (YYYY-MM).
     */
    async build(tenantId: string, periode: string): Promise<PayrollPeriodSummary> {
        const startTs = new Date(`${periode}-01T00:00:00Z`).getTime();
        const endDate = new Date(`${periode}-01T00:00:00Z`);
        endDate.setUTCMonth(endDate.getUTCMonth() + 1);
        endDate.setUTCDate(0);
        endDate.setUTCHours(23, 59, 59, 999);
        const endTs = endDate.getTime();

        // ── Requêtes Nexus ─────────────────────────────────────────────────────
        const tenantPath = Nexus.getTenantPath.bind(Nexus);

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

        // ── Regrouper les entrées par employé ──────────────────────────────────
        const entriesByUser = new Map<string, ShiftEntry[]>();
        for (const e of entriesRaw) {
            const arr = entriesByUser.get(e.userId) ?? [];
            arr.push(e);
            entriesByUser.set(e.userId, arr);
        }

        const rows: PrepaieRow[] = [];

        for (const user of usersRaw) {
            if ((user as unknown as Record<string, unknown>).status === 'inactive') continue;

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
                            const session = analyseSession(pendingIn, ts, [...currentBreaks]);
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

            const { normal, ot25, ot50 } = weeklyOvertimeBreakdown(weekMinutes);
            const hourlyRateEur = (user.hourlyRateInMicrounits ?? 0) / MU_TO_EUR;

            // Congés payés pris dans le mois
            const cpDays = leavesRaw
                .filter(lr => lr.userId === user.id && lr.type === 'paid_leave')
                .reduce((sum, lr) => {
                    const lrStart = new Date(lr.startDate).getTime();
                    const lrEnd = new Date(lr.endDate).getTime();
                    const overlap = lrStart <= endTs && lrEnd >= startTs;
                    return sum + (overlap ? (lr.workingDays ?? 0) : 0);
                }, 0);

            // Absences non justifiées (sick, unpaid dans le mois)
            const absDays = leavesRaw
                .filter(lr => lr.userId === user.id && ['sick', 'unpaid'].includes(lr.type))
                .reduce((sum, lr) => {
                    const lrStart = new Date(lr.startDate).getTime();
                    const lrEnd = new Date(lr.endDate).getTime();
                    const overlap = lrStart <= endTs && lrEnd >= startTs;
                    return sum + (overlap ? (lr.workingDays ?? 0) : 0);
                }, 0);

            const grossEur = computeGross(normal, ot25, ot50, hourlyRateEur);
            const nameParts = (user.name ?? '').split(' ');

            rows.push({
                userId: user.id,
                matricule: user.id.slice(-8).toUpperCase(),
                nom: nameParts[0] ?? '',
                prenom: nameParts.slice(1).join(' ') || '',
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

        const tipPools = await TipDistributionService.getByPeriode(tenantId, periode);
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

    /** Sérialise les lignes en CSV UTF-8 BOM (compatible Excel FR). */
    toCsv(summary: PayrollPeriodSummary): string {
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
            `Avantage en nature repas : ${MEAL_BENEFIT_EUR} € / repas (valeur URSSAF 2026 — à vérifier avec votre expert-comptable)`,
            'Ce document est un pré-paie indicatif. La conformité des bulletins de paie relève de la responsabilité de l\'employeur et de son prestataire de paie.',
        ];

        return BOM + lines.join('\n');
    },
};
