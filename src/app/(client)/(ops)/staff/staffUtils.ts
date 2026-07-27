import type { User } from "@nexus/contracts";

/**
 * 👥 Staff — types & helpers purs
 *
 * Extraits de staff/page.tsx (dette-5) pour alléger le god file (803 lignes)
 * et isoler la logique pure (calcul de paie depuis les pointages) — testable sans React.
 */

export type StaffTab = "team" | "planning" | "timesheet" | "leaves" | "recruitment" | "payroll" | "skills";

// ── Payroll helpers ────────────────────────────────────────────────────────────

const MU_TO_EUR = 1_000_000;

export interface PayrollRow {
    user: User;
    hours: number;
    hourlyRateEur: number;
    grossEur: number;
}

/**
 * Calcule la paie brute du mois pour chaque membre à partir des pointages.
 * Apparie chaque clock_in au clock_out suivant ; les pointages non appariés sont ignorés.
 */
export function computePayroll(
    members: User[],
    allLogs: { performedBy?: string; userId?: string; action?: string; type?: string; timestamp: string }[],
    month: string // "YYYY-MM"
): PayrollRow[] {
    return members.map(user => {
        const monthLogs = allLogs.filter(
            l => ((l.userId && l.userId === user.id) || (l.performedBy && l.performedBy === user.id)) &&
                 l.timestamp && l.timestamp.startsWith(month)
        );
        const sorted = [...monthLogs].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        let totalMinutes = 0;
        let pendingIn: number | null = null;
        for (const log of sorted) {
            const ts = new Date(log.timestamp).getTime();
            const act = (log.action || log.type || '').toUpperCase();
            if (act === "CLOCK_IN") {
                pendingIn = ts;
            } else if (act === "CLOCK_OUT" && pendingIn !== null) {
                totalMinutes += (ts - pendingIn) / 60_000;
                pendingIn = null;
            }
        }
        const hours = totalMinutes / 60;
        const rateInMu = user.hourlyRateInMicrounits ?? 0;
        const hourlyRateEur = rateInMu / MU_TO_EUR;
        const grossEur = hours * hourlyRateEur;
        return { user, hours, hourlyRateEur, grossEur };
    }).filter(r => r.hours > 0 || r.hourlyRateEur > 0);
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
