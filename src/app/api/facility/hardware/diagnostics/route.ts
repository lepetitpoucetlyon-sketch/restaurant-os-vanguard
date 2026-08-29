import { NextRequest, NextResponse } from 'next/server';
import { HardwareProvisioningService } from '@/modules/facility';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const caller = await requireTenantRole(req, 'manager');
    if (isDenied(caller)) return caller;

    const tenantId = caller.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non spécifié dans le jeton d\'authentification' }, { status: 403 });
    }

    const reports = await HardwareProvisioningService.getReports(tenantId);
    return NextResponse.json({ tenantId, reports, count: reports.length });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur récupération des rapports matériels' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = await requireTenantRole(req, 'manager');
    if (isDenied(caller)) return caller;

    const tenantId = caller.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non spécifié dans le jeton d\'authentification' }, { status: 403 });
    }

    const body = await req.json();
    const {
      siteName = 'Établissement Principal',
      technicianName = 'Technicien Déploiement',
      managerName = 'Directeur d Établissement',
    } = body || {};

    const report = await HardwareProvisioningService.runFullHardwareDiagnostic(
      tenantId,
      siteName,
      technicianName,
      managerName
    );

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur exécution autodiagnostic matériel' }, { status: 500 });
  }
}
