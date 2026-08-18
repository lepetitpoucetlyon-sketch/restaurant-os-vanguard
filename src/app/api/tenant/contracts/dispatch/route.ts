import { NextRequest, NextResponse } from 'next/server';
import { SovereignSignatureEngine, ContractDispatcherService } from '@/modules/compliance';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractId, tenantId, sendEmail, sendSms, signerPhone, signerEmail } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Le champ tenantId est requis' }, { status: 400 });
    }

    let contract = contractId
      ? (await SovereignSignatureEngine.getTenantContracts(tenantId)).find((c) => c.id === contractId)
      : (await SovereignSignatureEngine.getTenantContracts(tenantId))[0];

    // Création automatique si aucun contrat existant
    if (!contract) {
      contract = await SovereignSignatureEngine.createAndSendContract({
        tenantId,
        vertical: 'RESTAURANT',
        client: {
          companyName: body.companyName || 'Restaurant Client',
          legalForm: body.legalForm || 'SAS',
          siren: body.siren || '999999999',
          representativeName: body.representativeName || 'Gérant Principal',
          representativeRole: body.representativeRole || 'Gérant',
          email: signerEmail || body.email || 'gerant@restaurant.fr',
          phone: signerPhone || body.phone,
          address: body.address || '1 Rue du Restaurant',
          city: body.city || 'Paris',
          postalCode: body.postalCode || '75001',
        },
        pricing: {
          planName: body.planName || 'Restaurant OS Pro',
          monthlyPriceInEuros: body.monthlyPrice || 49,
          setupFeeInEuros: body.setupFee || 0,
          commitmentMonths: body.commitmentMonths || 0,
          billingCycle: 'MONTHLY',
          includedRegistersCount: 2,
          includedModules: ['POS', 'KDS', 'HACCP', 'STOCK', 'HR', 'LEGAL_NF525'],
        },
      });
    }

    const dispatchResult = await ContractDispatcherService.dispatchContract(contract, {
      sendEmail: sendEmail ?? true,
      sendSms: sendSms ?? Boolean(signerPhone || contract.client.phone),
      signerEmail,
      signerPhone,
      source: body.source || 'MCC_MANUAL',
    });

    return NextResponse.json({
      success: true,
      contractId: contract.id,
      dispatch: dispatchResult,
    });
  } catch (err) {
    logger.error('[Contracts Dispatch API] Erreur envoi', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur dispatch contrat' },
      { status: 500 }
    );
  }
}
