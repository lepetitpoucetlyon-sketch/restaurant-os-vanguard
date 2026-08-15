import { NextRequest, NextResponse } from 'next/server';
import { SovereignSignatureEngine, type SignatureSubmissionInput } from '@/modules/legal/services/SovereignSignatureEngine';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await context.params;

  try {
    const body = await req.json();
    const {
      tenantId,
      signerName,
      signerRole,
      signerEmail,
      signatureCanvasBase64,
      consentConfirmed,
    } = body;

    if (!tenantId || !signerName || !signerEmail || !signatureCanvasBase64) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants pour la signature' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser-WebClient';

    const submission: SignatureSubmissionInput = {
      signerName,
      signerRole: signerRole || 'Représentant Légal',
      signerEmail,
      signatureCanvasBase64,
      ipAddress,
      userAgent,
      consentConfirmed: Boolean(consentConfirmed),
    };

    const signedContract = await SovereignSignatureEngine.signContract(
      tenantId,
      contractId,
      submission
    );

    return NextResponse.json(
      {
        success: true,
        contractId: signedContract.id,
        status: signedContract.status,
        proofCertificate: signedContract.proofCertificate,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur exécution signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
