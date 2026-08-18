/**
 * GET & POST /api/tenant/franchise/transfers
 * Gestion et exécution des transferts de stock inter-sites.
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { FranchiseService } from '@/modules/commerce/relation/franchise/services/FranchiseService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import type { InterSiteTransfer } from '@/shared/nexus/contracts/franchise.types';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    const { tenantId } = caller as { tenantId: string };

    try {
        const transfers = await Nexus.adapter.query<InterSiteTransfer>(
            `tenants/${tenantId}/transfers`
        ).catch(() => []);

        return NextResponse.json({ transfers });
    } catch (error) {
        logger.error('[FranchiseAPI] Erreur de récupération des transferts', { error });
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    const { tenantId, email } = caller as { tenantId: string; email?: string };

    try {
        const body = await req.json() as {
            action?: 'create' | 'execute';
            transfer?: InterSiteTransfer;
            groupId?: string;
            targetTenantId?: string;
            targetTenantName?: string;
            sourceTenantName?: string;
            items?: InterSiteTransfer['items'];
            notes?: string;
        };

        if (body.action === 'execute' && body.transfer) {
            const executed = await FranchiseService.executeStockTransfer(
                body.transfer,
                email || `admin_${tenantId}`
            );
            return NextResponse.json({ success: true, transfer: executed });
        }

        if (!body.targetTenantId || !body.items || body.items.length === 0) {
            return NextResponse.json(
                { error: 'targetTenantId et items sont requis pour initier un transfert' },
                { status: 400 }
            );
        }

        const created = await FranchiseService.createStockTransfer({
            groupId: body.groupId,
            sourceTenantId: tenantId,
            sourceTenantName: body.sourceTenantName || tenantId,
            targetTenantId: body.targetTenantId,
            targetTenantName: body.targetTenantName || body.targetTenantId,
            requestedBy: email || `admin_${tenantId}`,
            items: body.items,
            notes: body.notes,
        });

        return NextResponse.json({ success: true, transfer: created }, { status: 201 });
    } catch (error) {
        logger.error('[FranchiseAPI] Erreur lors du traitement du transfert', { error });
        return NextResponse.json({ error: 'Erreur lors du traitement du transfert' }, { status: 500 });
    }
}
