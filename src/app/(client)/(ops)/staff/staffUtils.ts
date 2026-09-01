import type { User } from "@nexus/contracts";
import { HcrPayrollEngine, type HcrEmployeeMonthlyPayroll } from "@/modules/human";

/**
 * 👥 Staff — types & helpers purs
 * Logique pure (calcul de paie HCR et facturation freelance depuis les pointages).
 */

export type StaffTab = "team" | "planning" | "timesheet" | "leaves" | "recruitment" | "payroll" | "freelance" | "skills";

const MU_TO_EUR = 1_000_000;

export interface PayrollRow {
    user: User;
    hours: number;
    hourlyRateEur: number;
    grossEur: number;
    // Détails HCR
    regularHours?: number;
    overtimeHours?: number;
    nightHours?: number;
    mealCount?: number;
    hcrPayroll?: HcrEmployeeMonthlyPayroll;
}

export interface ContractorRow {
    contractor: User;
    companyName: string;
    siret: string;
    vatRegime: 'franchise_art_293b' | 'vat_standard_20' | 'vat_exempt';
    hours: number;
    hourlyRateEur: number;
    totalHtEur: number;
    totalVatEur: number;
    totalTtcEur: number;
    shiftsCount: number;
    vigilanceStatus: 'valid' | 'expiring_soon' | 'missing';
    selfBillingAgreed: boolean;
    iban?: string;
}

/**
 * Calcule la paie brute du mois pour chaque salarié selon les règles HCR à partir des pointages.
 */
export function computePayroll(
    members: User[],
    allLogs: { performedBy?: string; userId?: string; action?: string; type?: string; timestamp: string }[],
    month: string // "YYYY-MM"
): PayrollRow[] {
    // Filtrer uniquement les salariés (non freelances)
    const employees = members.filter(u => u.employmentStatus !== 'contractor' && u.contractType !== 'freelance');

    return employees.map(user => {
        const monthLogs = allLogs.filter(
            l => (l.userId === user.id || l.performedBy === user.id) &&
                 l.timestamp.startsWith(month)
        );
        const sorted = [...monthLogs].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const shifts: { startTime: string; endTime: string; date: string }[] = [];
        let pendingIn: { ts: number; dateStr: string; timeStr: string } | null = null;

        for (const log of sorted) {
            const dateObj = new Date(log.timestamp);
            const ts = dateObj.getTime();
            const act = (log.action || log.type || '').toUpperCase();
            const dateStr = log.timestamp.split('T')[0];
            const timeStr = dateObj.toTimeString().slice(0, 5);

            if (act === "CLOCK_IN") {
                pendingIn = { ts, dateStr, timeStr };
            } else if (act === "CLOCK_OUT" && pendingIn !== null) {
                shifts.push({
                    date: pendingIn.dateStr,
                    startTime: pendingIn.timeStr,
                    endTime: timeStr,
                });
                pendingIn = null;
            }
        }

        const hcrPayroll = HcrPayrollEngine.computeMonthlyPayroll(user, shifts, month);
        const rateInMu = user.hourlyRateInMicrounits ?? (15 * MU_TO_EUR);
        const hourlyRateEur = rateInMu / MU_TO_EUR;

        return {
            user,
            hours: hcrPayroll.totalHours,
            hourlyRateEur,
            grossEur: hcrPayroll.grossTotalSalaryEur,
            regularHours: hcrPayroll.regularHours,
            overtimeHours: hcrPayroll.overtimeTier1Hours + hcrPayroll.overtimeTier2Hours + hcrPayroll.overtimeTier3Hours,
            nightHours: hcrPayroll.nightHours,
            mealCount: hcrPayroll.mealCount,
            hcrPayroll,
        };
    }).filter(r => r.hours > 0 || r.hourlyRateEur > 0);
}

/**
 * Calcule les honoraires et vacations des prestataires freelances / auto-entrepreneurs.
 */
export function computeContractorBilling(
    members: User[],
    allLogs: { performedBy?: string; userId?: string; action?: string; type?: string; timestamp: string }[],
    month: string // "YYYY-MM"
): ContractorRow[] {
    const contractors = members.filter(u => u.employmentStatus === 'contractor' || u.contractType === 'freelance');

    return contractors.map(contractor => {
        const profile = contractor.contractorProfile;
        const rateInMu = profile?.rateInMicrounits ?? (contractor.hourlyRateInMicrounits || (25 * MU_TO_EUR));
        const hourlyRateEur = rateInMu / MU_TO_EUR;
        const vatRegime = profile?.vatRegime || 'franchise_art_293b';
        const vatRate = vatRegime === 'vat_standard_20' ? 0.20 : 0;

        const monthLogs = allLogs.filter(
            l => (l.userId === contractor.id || l.performedBy === contractor.id) &&
                 l.timestamp.startsWith(month)
        );
        const sorted = [...monthLogs].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        let totalMinutes = 0;
        let shiftsCount = 0;
        let pendingIn: number | null = null;

        for (const log of sorted) {
            const ts = new Date(log.timestamp).getTime();
            const act = (log.action || log.type || '').toUpperCase();
            if (act === "CLOCK_IN") {
                pendingIn = ts;
            } else if (act === "CLOCK_OUT" && pendingIn !== null) {
                totalMinutes += (ts - pendingIn) / 60_000;
                shiftsCount++;
                pendingIn = null;
            }
        }

        const hours = Number((totalMinutes / 60).toFixed(2));
        const totalHtEur = Number((hours * hourlyRateEur).toFixed(2));
        const totalVatEur = Number((totalHtEur * vatRate).toFixed(2));
        const totalTtcEur = Number((totalHtEur + totalVatEur).toFixed(2));

        // Détection de la validité de l'attestation URSSAF
        let vigilanceStatus: 'valid' | 'expiring_soon' | 'missing' = 'missing';
        if (profile?.urssafVigilanceCertificateUrl) {
            if (profile.urssafVigilanceValidUntil) {
                const expiry = new Date(profile.urssafVigilanceValidUntil).getTime();
                const now = Date.now();
                if (expiry < now) {
                    vigilanceStatus = 'missing';
                } else if (expiry - now < 30 * 24 * 60 * 60 * 1000) {
                    vigilanceStatus = 'expiring_soon';
                } else {
                    vigilanceStatus = 'valid';
                }
            } else {
                vigilanceStatus = 'valid';
            }
        }

        return {
            contractor,
            companyName: profile?.companyName || contractor.name,
            siret: profile?.siret || 'Non renseigné',
            vatRegime,
            hours,
            hourlyRateEur,
            totalHtEur,
            totalVatEur,
            totalTtcEur,
            shiftsCount,
            vigilanceStatus,
            selfBillingAgreed: profile?.selfBillingAgreed || false,
            iban: profile?.iban,
        };
    });
}

// ── Staff document types ───────────────────────────────────────────────────────

export interface StaffDocument {
    id: string;
    userId: string;
    name: string;
    url: string;
    uploadedAt: string;
}

// ── Known skills (extend as needed) ───────────────────────────────────────────

export const KNOWN_SKILLS = [
    "Service en salle",
    "Sommellerie",
    "Cuisine",
    "Pâtisserie",
    "Barista",
    "Caisse / POS",
    "HACCP",
    "Management",
    "Langues étrangères",
    "Permis B",
];
