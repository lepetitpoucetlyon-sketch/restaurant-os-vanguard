import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { SovereignSignatureEngine } from '@/modules/legal/services/SovereignSignatureEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  const tenantId = caller.tenantId;

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
