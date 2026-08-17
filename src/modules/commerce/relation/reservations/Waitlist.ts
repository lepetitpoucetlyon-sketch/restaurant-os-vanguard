import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

interface WaitlistEntry {
    id: string;
    tenantId: string;
    guestName: string;
    guestPhone?: string;
    partySize: number;
    estimatedWaitMinutes: number;
    status: 'waiting' | 'notified' | 'seated' | 'left';
    addedAt: string;
    seatedAt?: string;
    subjectId?: string;
}

export const WaitlistService = {
    async add(
        tenantId: string,
        guestName: string,
        partySize: number,
        guestPhone?: string,
        subjectId?: string
    ): Promise<WaitlistEntry> {
        const waiting = await this.getActive(tenantId);
        const avgWait = waiting.length > 0 ? 15 : 5;
        const estimatedWaitMinutes = avgWait * (waiting.length + 1);

        const id = Nexus.adapter.generateId(`tenants/${tenantId}/waitlist`);
        const entry: WaitlistEntry = {
            id,
            tenantId,
            guestName,
            guestPhone,
            partySize,
            estimatedWaitMinutes,
            status: 'waiting',
            addedAt: new Date().toISOString(),
            subjectId,
        };

        await Nexus.adapter.set(
            `tenants/${tenantId}/waitlist/${id}`,
            entry
        );

        return entry;
    },

    async seat(tenantId: string, entryId: string): Promise<void> {
        await Nexus.adapter.update(
            `tenants/${tenantId}/waitlist/${entryId}`,
            { status: 'seated', seatedAt: new Date().toISOString() }
        );
    },

    async notify(tenantId: string, entryId: string): Promise<void> {
        const entry = await Nexus.adapter.get<WaitlistEntry>(`tenants/${tenantId}/waitlist/${entryId}`);
        await Nexus.adapter.update(
            `tenants/${tenantId}/waitlist/${entryId}`,
            { status: 'notified' }
        );

        if (entry) {
            await NexusEventBus.emitDurable('commerce.waitlist_ready', {
                v: 1,
                tenantId,
                waitlistEntryId: entryId,
                guestName: entry.guestName,
                guestPhone: entry.guestPhone,
                partySize: entry.partySize,
                estimatedWaitMinutes: entry.estimatedWaitMinutes,
            });
        }
    },

    async remove(tenantId: string, entryId: string): Promise<void> {
        await Nexus.adapter.update(
            `tenants/${tenantId}/waitlist/${entryId}`,
            { status: 'left' }
        );
    },

    async getActive(tenantId: string): Promise<WaitlistEntry[]> {
        return Nexus.adapter.query<WaitlistEntry>(
            `tenants/${tenantId}/waitlist`,
            {
                where: [{ field: 'status', operator: 'in', value: ['waiting', 'notified'] }],
                orderBy: { field: 'addedAt', direction: 'asc' },
            }
        );
    },
};
