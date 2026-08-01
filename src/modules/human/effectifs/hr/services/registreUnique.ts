import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { EmployeeDocument } from '@/domain/schemas/employeeDocument';

interface RegistreEntry {
    userId: string;
    firstName: string;
    lastName: string;
    role: string;
    hireDate: string;
    endDate?: string;
    contractType: string;
    nationality?: string;
    workPermitExpiry?: string;
    documents: EmployeeDocument[];
}

export class RegistreUniqueService {
    async generate(tenantId: string): Promise<RegistreEntry[]> {
        const users = await Nexus.adapter.query<{
            id: string;
            firstName?: string;
            lastName?: string;
            role?: string;
            hireDate?: string;
            endDate?: string;
            contractType?: string;
            nationality?: string;
        }>(`tenants/${tenantId}/users`);

        const entries: RegistreEntry[] = [];

        for (const user of users) {
            const docs = await Nexus.adapter.query<EmployeeDocument>(
                `tenants/${tenantId}/employeeDocuments`,
                { where: [{ field: 'userId', operator: '==', value: user.id }] }
            );

            const workPermit = docs.find(d => d.type === 'work_permit');

            entries.push({
                userId: user.id,
                firstName: user.firstName ?? '',
                lastName: user.lastName ?? '',
                role: user.role ?? '',
                hireDate: user.hireDate ?? '',
                endDate: user.endDate,
                contractType: user.contractType ?? 'CDI',
                nationality: user.nationality,
                workPermitExpiry: workPermit?.expiresAt,
                documents: docs,
            });
        }

        return entries.sort((a, b) => a.hireDate.localeCompare(b.hireDate));
    }

    async exportCSV(tenantId: string): Promise<string> {
        const entries = await this.generate(tenantId);
        const header = 'Nom,Prénom,Fonction,Date embauche,Fin contrat,Type contrat,Nationalité,Permis travail expire';
        const rows = entries.map(e =>
            [e.lastName, e.firstName, e.role, e.hireDate, e.endDate ?? '', e.contractType, e.nationality ?? '', e.workPermitExpiry ?? ''].join(',')
        );
        return [header, ...rows].join('\n');
    }

    async getExpiringDocuments(tenantId: string, daysAhead: number = 30): Promise<EmployeeDocument[]> {
        const docs = await Nexus.adapter.query<EmployeeDocument>(
            `tenants/${tenantId}/employeeDocuments`
        );

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + daysAhead);
        const cutoffStr = cutoff.toISOString();

        return docs.filter(d =>
            d.expiresAt && d.expiresAt <= cutoffStr && d.status !== 'expired'
        );
    }
}

export const registreUniqueService = new RegistreUniqueService();
