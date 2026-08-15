import { NextRequest, NextResponse } from 'next/server';
import { HardwareProvisioningService } from '@/modules/facility/services/HardwareProvisioningService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId manquant' }, { status: 400 });
  }

  try {
    const reports = await HardwareProvisioningService.getReports(tenantId);
    return NextResponse.json({ tenantId, reports, count: reports.length });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur récupération des rapports matériels' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      siteName = 'Établissement Principal',
      technicianName = 'Technicien Déploiement',
      managerName = 'Directeur d Établissement',
    } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId manquant' }, { status: 400 });
    }

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
