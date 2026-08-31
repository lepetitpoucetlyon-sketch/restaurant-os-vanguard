/**
 * GET /api/admin/hr/payroll/settings
 * Retourne la configuration provider paie du tenant courant.
 * Utilisé par PayrollIntegrationPanel pour afficher le provider actif.
 */
import 'server-only';
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { PayrollProviderConfig } from '@/modules/human';
import type { JsonObject } from "@/shared/types/json";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    const path = Nexus.getTenantPath('settings/payroll', caller.tenantId);
    const config = await Nexus.adapter.get<PayrollProviderConfig>(path);

    // Ne pas exposer les credentials — retourner uniquement les métadonnées
    return NextResponse.json({
        provider: config?.provider ?? null,
        connectedAt: (config as JsonObject | null)?.connectedAt ?? null,
        providerInfo: (config as JsonObject | null)?.providerInfo ?? null,
    });
}
