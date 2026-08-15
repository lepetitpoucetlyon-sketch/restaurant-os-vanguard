import { NextRequest, NextResponse } from 'next/server';
import { SovereignSignatureEngine } from '@/modules/legal/services/SovereignSignatureEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
  }

  try {
    const contracts = await SovereignSignatureEngine.getTenantContracts(tenantId);
    return NextResponse.json({
      tenantId,
      contracts,
      hasPendingSignature: contracts.some((c) => c.status === 'SENT' || c.status === 'VIEWED'),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur récupération des contrats tenant' }, { status: 500 });
  }
}
