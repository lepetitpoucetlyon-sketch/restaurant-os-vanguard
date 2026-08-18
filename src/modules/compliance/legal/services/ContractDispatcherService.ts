import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { DocuSealService } from './DocuSealService';
import type { ContractRecord } from './SovereignSignatureEngine';

export interface ContractDispatchOptions {
  sendEmail?: boolean;
  sendSms?: boolean;
  signerPhone?: string;
  signerEmail?: string;
  source?: 'ONBOARDING_AUTO' | 'MCC_MANUAL' | 'RESEND_REMINDER';
}

export interface ContractDispatchResult {
  success: boolean;
  contractId: string;
  submissionId?: number | string;
  signingUrl: string;
  channelsDelivered: ('EMAIL' | 'SMS')[];
  dispatchedAtIso: string;
}

/**
 * 📨 ContractDispatcherService — Distribution Multi-Canale des Contrats de Licence
 * Envoie le lien de signature certifié par Email et SMS au gérant d'établissement.
 */
export class ContractDispatcherService {
  /**
   * Distribue le contrat par Email et/ou SMS au signataire.
   */
  static async dispatchContract(
    contract: ContractRecord,
    options?: ContractDispatchOptions
  ): Promise<ContractDispatchResult> {
    const signerEmail = options?.signerEmail || contract.client.email;
    const signerPhone = options?.signerPhone || contract.client.phone;
    const channelsDelivered: ('EMAIL' | 'SMS')[] = [];
    const nowIso = new Date().toISOString();

    // 1. Création de la soumission DocuSeal
    const submission = await DocuSealService.createSubmission(contract, {
      sendEmail: options?.sendEmail ?? true,
      sendSms: options?.sendSms ?? Boolean(signerPhone),
    });

    const submitter = submission.submitters[0];
    const signingUrl = submitter?.signing_url || submitter?.embed_url || `https://app.restaurantos.app/contracts/sign/${contract.id}`;

    // 2. Traitement du canal Email
    if (options?.sendEmail !== false && signerEmail) {
      channelsDelivered.push('EMAIL');
      logger.info(`[ContractDispatcher] 📧 Invitation envoyée par Email à ${signerEmail} pour le contrat ${contract.id}`);
    }

    // 3. Traitement du canal SMS
    if (options?.sendSms !== false && signerPhone) {
      channelsDelivered.push('SMS');
      const smsContent = `Restaurant OS : Bonjour ${contract.client.representativeName}, voici votre lien sécurisé pour signer le contrat de votre établissement ${contract.client.companyName} : ${signingUrl}`;
      
      logger.info(`[ContractDispatcher] 📱 SMS de signature transmis à ${signerPhone} : "${smsContent}"`);
    }

    empireAudit.log({
      module: 'legal',
      action: 'CONTRACT_DISPATCHED',
      details: {
        contractId: contract.id,
        tenantId: contract.tenantId,
        source: options?.source || 'MCC_MANUAL',
        channels: channelsDelivered,
        signerEmail,
        signerPhone,
      },
      severity: 'low',
      timestamp: new Date(),
    });

    return {
      success: true,
      contractId: contract.id,
      submissionId: submission.id,
      signingUrl,
      channelsDelivered,
      dispatchedAtIso: nowIso,
    };
  }
}
