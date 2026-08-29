import { NextRequest, NextResponse } from 'next/server';
import { SovereignSignatureEngine, type ContractDraftInput } from '@/modules/compliance';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const caller = await requireMccLevel(req, 'mcc_support');
    if (isDenied(caller)) return caller;

    const contracts = await SovereignSignatureEngine.getAllFleetContracts();
    return NextResponse.json({
      contracts,
      totalCount: contracts.length,
      signedCount: contracts.filter((c) => c.status === 'SIGNED').length,
      pendingCount: contracts.filter((c) => c.status === 'SENT' || c.status === 'VIEWED').length,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur récupération des contrats MCC' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = await requireMccLevel(req, 'mcc_super_admin');
    if (isDenied(caller)) return caller;

    const body = (await req.json()) as ContractDraftInput;

    if (!body.tenantId || !body.vertical || !body.client || !body.pricing) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: tenantId, vertical, client, pricing' },
        { status: 400 }
      );
    }

    const contract = await SovereignSignatureEngine.createAndSendContract(body);

    return NextResponse.json(
      {
        success: true,
        contractId: contract.id,
        status: contract.status,
        signingToken: contract.signingToken,
        createdAt: contract.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Erreur création du contrat' }, { status: 500 });
  }
}
