import { type NextRequest, NextResponse } from 'next/server';
import { HardwareProvisioningService } from '@/modules/facility';
import { withTenantRoute } from '@/lib/server/routeWrapper';

export const dynamic = 'force-dynamic';

export const GET = withTenantRoute(
  async (_req: NextRequest, ctx) => {
    try {
      const reports = await HardwareProvisioningService.getReports(ctx.tenantId);
      return NextResponse.json({ tenantId: ctx.tenantId, reports, count: reports.length });
    } catch {
      return NextResponse.json({ error: 'Erreur récupération des rapports matériels' }, { status: 500 });
    }
  },
  { minRole: 'manager' },
);

export const POST = withTenantRoute(
  async (req: NextRequest, ctx) => {
    try {
      const body = await req.json();
      const {
        siteName = 'Établissement Principal',
        technicianName = 'Technicien Déploiement',
        managerName = 'Directeur d Établissement',
      } = body || {};

      const report = await HardwareProvisioningService.runFullHardwareDiagnostic(
        ctx.tenantId,
        siteName,
        technicianName,
        managerName,
      );

      return NextResponse.json({ success: true, report }, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Erreur exécution autodiagnostic matériel' }, { status: 500 });
    }
  },
  { minRole: 'manager' },
);
