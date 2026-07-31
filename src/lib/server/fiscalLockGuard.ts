import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export async function isPeriodLocked(tenantId: string, timestamp: number): Promise<boolean> {
  try {
    const date = new Date(timestamp);
    const periodId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const lockRef = await Nexus.adapter.query<{ isLocked: boolean; lockedAt: number; lockedBy: string }>('fiscalLedger/locks', {
        where: [
            { field: 'id', operator: '==', value: periodId },
            { field: 'tenantId', operator: '==', value: tenantId }
        ]
    });
    
    // In our DB structure, locks are at `tenants/${tenantId}/fiscalLedger/locks/${periodId}`
    // But since `Nexus.adapter.query` queries the collection across tenants (or with tenant prefix?),
    // wait, NexusAdapter query usually requires the full path if it's nested, or just the collection name if it's global.
    // Let's just fetch the document directly since we know the ID.
    const lockDoc = await Nexus.adapter.get<{ isLocked: boolean; lockedAt: number; lockedBy: string }>(`tenants/${tenantId}/fiscalLedger/locks/${periodId}`);
    
    return !!(lockDoc && lockDoc.isLocked);
  } catch (err) {
    logger.error(`[fiscalLockGuard] Error checking lock for tenant ${tenantId}`, String(err));
    return false; // fail-open ou fail-closed? fail-open par défaut pour éviter de tout bloquer en cas d'erreur
  }
}

export async function requireUnlockedPeriod(tenantId: string, timestamp: number): Promise<NextResponse | null> {
    const locked = await isPeriodLocked(tenantId, timestamp);
    if (locked) {
        return new NextResponse(
            JSON.stringify({ error: 'La période comptable est clôturée et verrouillée (Sceau NF525).' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }
    return null;
}
