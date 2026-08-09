/**
 * GET /api/admin/fleet/tenant-users?tenantId=xxx
 * Liste les utilisateurs d'un tenant donné pour la vue MCC.
 * Protégé : mcc_support minimum.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import type { User } from '@/modules/human';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
  }

  try {
    const users = await Nexus.adapter.query<User>(`tenants/${tenantId}/users`);

    empireAudit.log({
      module: 'fleet',
      action: 'TENANT_USERS_LISTED',
      severity: 'low',
      details: { tenantId, count: users.length },
      timestamp: new Date(),
    });

    return NextResponse.json({
      users: users.map(u => ({
        id:         u.id,
        name:       u.name,
        email:      u.email ?? null,
        role:       u.role,
        lastActive: u.lastActive ?? null,
        status:     u.status,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 },
    );
  }
}
