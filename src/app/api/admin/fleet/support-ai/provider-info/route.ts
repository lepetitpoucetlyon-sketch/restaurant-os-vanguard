import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { MCCAIRegistry } from '@/kernel/ai/mcc';

/**
 * GET /api/admin/fleet/support-ai/provider-info
 *
 * Retourne le provider IA MCC actif pour l'UI dynamique.
 * RBAC : mcc_junior_dev (lecture seule).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    const caller = await requireMccLevel(req, 'mcc_junior_dev');
    if (isDenied(caller)) return caller as NextResponse;

    try {
        return NextResponse.json({
            activeProvider: MCCAIRegistry.activeProviderName,
            activeModel: MCCAIRegistry.activeModel,
            mode: MCCAIRegistry.mode,
        });
    } catch (err) {
        return NextResponse.json(
            { error: 'Impossible de résoudre le provider MCC', detail: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
