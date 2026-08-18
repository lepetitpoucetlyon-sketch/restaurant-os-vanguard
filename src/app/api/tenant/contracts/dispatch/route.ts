import { NextRequest, NextResponse } from 'next/server';
import { SovereignSignatureEngine, ContractDispatcherService, type ContractRecord, type ContractDraftInput } from '@/modules/compliance';
import { logger } from '@/lib/logger';

interface DispatchRequestBody {
  contractId?: string;
  tenantId?: string;
  subdomain?: string;
  companyName?: string;
  legalForm?: string;
  siren?: string;
  representativeName?: string;
  representativeRole?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  planName?: string;
  monthlyPrice?: number;
  setupFee?: number;
  commitmentMonths?: number;
  sendEmail?: boolean;
  sendSms?: boolean;
  signerPhone?: string;
  signerEmail?: string;
  source?: 'ONBOARDING_AUTO' | 'MCC_MANUAL' | 'RESEND_REMINDER';
}

const DEFAULT_CLIENT = {
  companyName: 'Restaurant Client',
  legalForm: 'SAS',
  siren: '999999999',
  representativeName: 'Gérant Principal',
  representativeRole: 'Gérant',
  email: 'gerant@restaurant.fr',
  address: '1 Rue du Restaurant',
  city: 'Paris',
  postalCode: '75001',
};

const DEFAULT_PRICING = {
  planName: 'Restaurant OS Pro',
  monthlyPriceInEuros: 49,
  setupFeeInEuros: 0,
  commitmentMonths: 0,
  billingCycle: 'MONTHLY' as const,
  includedRegistersCount: 2,
  includedModules: ['POS', 'KDS', 'HACCP', 'STOCK', 'HR', 'LEGAL_NF525'],
};

function buildDefaultDraftInput(tenantId: string, body: DispatchRequestBody): ContractDraftInput {
  return {
    tenantId,
    vertical: 'RESTAURANT',
    client: {
      ...DEFAULT_CLIENT,
      companyName: body.companyName ?? DEFAULT_CLIENT.companyName,
      legalForm: body.legalForm ?? DEFAULT_CLIENT.legalForm,
      siren: body.siren ?? DEFAULT_CLIENT.siren,
      representativeName: body.representativeName ?? DEFAULT_CLIENT.representativeName,
      representativeRole: body.representativeRole ?? DEFAULT_CLIENT.representativeRole,
      email: body.signerEmail ?? body.email ?? DEFAULT_CLIENT.email,
      phone: body.signerPhone ?? body.phone,
      address: body.address ?? DEFAULT_CLIENT.address,
      city: body.city ?? DEFAULT_CLIENT.city,
      postalCode: body.postalCode ?? DEFAULT_CLIENT.postalCode,
    },
    pricing: {
      ...DEFAULT_PRICING,
      planName: body.planName ?? DEFAULT_PRICING.planName,
      monthlyPriceInEuros: body.monthlyPrice ?? DEFAULT_PRICING.monthlyPriceInEuros,
      setupFeeInEuros: body.setupFee ?? DEFAULT_PRICING.setupFeeInEuros,
      commitmentMonths: body.commitmentMonths ?? DEFAULT_PRICING.commitmentMonths,
    },
  };
}

async function resolveOrCreateContract(tenantId: string, body: DispatchRequestBody): Promise<ContractRecord> {
  const existingContracts = await SovereignSignatureEngine.getTenantContracts(tenantId);
  const found = body.contractId ? existingContracts.find((c) => c.id === body.contractId) : existingContracts[0];

  if (found) {
    return found;
  }

  return SovereignSignatureEngine.createAndSendContract(buildDefaultDraftInput(tenantId, body));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DispatchRequestBody;

    if (!body?.tenantId) {
      return NextResponse.json({ error: 'Le champ tenantId est requis' }, { status: 400 });
    }

    const contract = await resolveOrCreateContract(body.tenantId, body);

    const dispatchResult = await ContractDispatcherService.dispatchContract(contract, {
      sendEmail: body.sendEmail ?? true,
      sendSms: body.sendSms ?? Boolean(body.signerPhone || contract.client.phone),
      signerEmail: body.signerEmail,
      signerPhone: body.signerPhone,
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
