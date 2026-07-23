/**
 * MergePayrollClient — Client Merge.dev HRIS unified API
 *
 * Merge.dev expose une API unifiée vers PayFit, BambooHR, ADP, Gusto, etc.
 * Un seul client → tous les prestataires RH du client.
 *
 * Flow OAuth :
 *   1. GET  /api/admin/hr/payroll/merge/link-token  → `link_token` (short-lived)
 *   2. Client ouvre Merge Link UI avec ce token → connecte son compte PayFit etc.
 *   3. POST /api/admin/hr/payroll/merge/exchange    → échange `public_token` → `account_token`
 *   4. `account_token` stocké chiffré dans Nexus (tenants/{id}/settings/payroll)
 *   5. POST /api/admin/hr/payroll/merge/sync        → push pré-paie
 *
 * Docs : https://docs.merge.dev/merge-unified/hris/
 */

import type { PrepaieRow, PayrollPeriodSummary, PayrollProviderConfig } from './types';
import { logger } from '@/lib/logger';

const MERGE_BASE = 'https://api.merge.dev/api/hris/v1';
const MERGE_AUTH  = 'https://api.merge.dev/api';

const MERGE_API_KEY = process.env.MERGE_API_KEY ?? '';

interface MergeEmployee {
    remote_id?: string;
    employee_number?: string;
    first_name: string;
    last_name: string;
    work_email?: string;
    employment_status: 'ACTIVE' | 'INACTIVE';
    employment_type?: string;
    start_date?: string;
}

interface MergeTimeOff {
    employee: string;          // Merge employee ID
    approver?: string;
    status: 'APPROVED';
    units: 'DAYS';
    amount: number;
    request_type: 'VACATION' | 'SICK' | 'PERSONAL';
    start_time: string;        // ISO
    end_time: string;
}

export class MergePayrollClient {
    private accountToken: string;

    constructor(config: PayrollProviderConfig) {
        this.accountToken = config.mergeAccountToken ?? '';
    }

    private headers() {
        return {
            'Authorization': `Bearer ${MERGE_API_KEY}`,
            'X-Account-Token': this.accountToken,
            'Content-Type': 'application/json',
        };
    }

    private async get<T>(path: string): Promise<T> {
        const res = await fetch(`${MERGE_BASE}${path}`, {
            headers: this.headers(),
            signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) throw new Error(`Merge GET ${path} → ${res.status}`);
        return res.json() as Promise<T>;
    }

    private async post<T>(path: string, body: unknown): Promise<T> {
        const res = await fetch(`${MERGE_BASE}${path}`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Merge POST ${path} → ${res.status}: ${err}`);
        }
        return res.json() as Promise<T>;
    }

    // ── Lien OAuth ─────────────────────────────────────────────────────────────

    /** Génère un link_token pour ouvrir Merge Link dans le navigateur client. */
    static async createLinkToken(tenantId: string): Promise<{ link_token: string }> {
        const res = await fetch(`${MERGE_AUTH}/integrations/create-link-token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MERGE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                end_user_origin_id: tenantId,
                end_user_organization_name: tenantId,
                end_user_email_address: `payroll+${tenantId}@restaurant-os.io`,
                categories: ['hris'],
            }),
            signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) throw new Error(`Merge link token failed: ${res.status}`);
        return res.json() as Promise<{ link_token: string }>;
    }

    /** Échange un public_token (reçu après Merge Link) contre un account_token. */
    static async exchangeToken(publicToken: string): Promise<{ account_token: string }> {
        const res = await fetch(`${MERGE_AUTH}/integrations/retrieve`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MERGE_API_KEY}`,
                'X-Account-Token': publicToken,
            },
            signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) throw new Error(`Merge token exchange failed: ${res.status}`);
        return res.json() as Promise<{ account_token: string }>;
    }

    // ── Sync employés ──────────────────────────────────────────────────────────

    /** Récupère les employés déjà présents côté provider (pour réconciliation). */
    async listRemoteEmployees(): Promise<MergeEmployee[]> {
        const data = await this.get<{ results: MergeEmployee[] }>('/employees?page_size=200');
        return data.results ?? [];
    }

    /** Crée ou met à jour un employé via Merge HRIS. */
    async upsertEmployee(row: PrepaieRow): Promise<{ id: string }> {
        const payload: MergeEmployee = {
            first_name: row.prenom || row.nom,
            last_name: row.prenom ? row.nom : '',
            work_email: row.email,
            employment_status: 'ACTIVE',
            employment_type: row.contrat === 'cdi' ? 'FULL_TIME' : 'PART_TIME',
            start_date: row.dateEntree,
            employee_number: row.matricule,
        };
        return this.post<{ id: string }>('/employees', { model: payload });
    }

    // ── Sync absences ──────────────────────────────────────────────────────────

    /** Pousse les congés payés pris dans le mois. */
    async pushTimeOff(
        mergeEmployeeId: string,
        row: PrepaieRow,
    ): Promise<void> {
        if (row.congesPayesJours === 0) return;

        const start = new Date(`${row.periode}-01T08:00:00Z`);
        const end = new Date(start);
        end.setDate(end.getDate() + row.congesPayesJours);

        const payload: MergeTimeOff = {
            employee: mergeEmployeeId,
            status: 'APPROVED',
            units: 'DAYS',
            amount: row.congesPayesJours,
            request_type: 'VACATION',
            start_time: start.toISOString(),
            end_time: end.toISOString(),
        };
        await this.post('/time-off', { model: payload });
    }

    // ── Sync complète ──────────────────────────────────────────────────────────

    async syncPeriod(summary: PayrollPeriodSummary): Promise<{
        success: boolean;
        synced: number;
        errors: string[];
    }> {
        const errors: string[] = [];
        let synced = 0;

        // Récupérer les employés existants pour réconciliation par matricule
        const remoteMap = new Map<string, string>(); // matricule → merge ID
        try {
            const remote = await this.listRemoteEmployees();
            for (const emp of remote) {
                if (emp.employee_number) remoteMap.set(emp.employee_number, emp.remote_id ?? '');
            }
        } catch (err) {
            logger.warn('[MergePayroll] Failed to list remote employees', String(err));
        }

        for (const row of summary.rows) {
            try {
                let mergeId = remoteMap.get(row.matricule);

                // Créer l'employé s'il n'existe pas encore
                if (!mergeId) {
                    const created = await this.upsertEmployee(row);
                    mergeId = created.id;
                    remoteMap.set(row.matricule, mergeId);
                }

                // Pousser les congés
                if (mergeId) {
                    await this.pushTimeOff(mergeId, row);
                }

                synced++;
            } catch (err) {
                errors.push(`${row.matricule}: ${String(err)}`);
            }
        }

        return { success: errors.length === 0, synced, errors };
    }
}
