import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { ContractRecord } from './SovereignSignatureEngine';

export interface DocuSealSubmitter {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  fields?: Array<{
    name: string;
    default_value?: string;
    readonly?: boolean;
  }>;
}

export interface DocuSealSubmissionResponse {
  id: number | string;
  slug: string;
  status: 'draft' | 'pending' | 'completed' | 'expired';
  submitters: Array<{
    id: number | string;
    slug: string;
    email: string;
    phone?: string;
    status: 'pending' | 'opened' | 'signed';
    embed_url: string;
    signing_url: string;
    signed_at?: string;
  }>;
  documents?: Array<{
    name: string;
    url: string;
  }>;
}

export interface DocuSealWebhookPayload {
  event_type: 'submission.created' | 'submission.opened' | 'submission.completed';
  timestamp?: string;
  data: {
    id: number | string;
    slug: string;
    status: string;
    template_id?: number | string;
    submitters: Array<{
      id: number | string;
      email: string;
      phone?: string;
      status: string;
      signed_at?: string;
      metadata?: Record<string, unknown>;
    }>;
    documents?: Array<{
      url: string;
      filename: string;
    }>;
    audit_log_url?: string;
  };
}

/**
 * 🦭 DocuSealService — Passerelle d'E-Signature Documentaire Ouverte
 * Gère la communication avec l'API DocuSeal (Cloud ou On-Premise) pour l'émission,
 * le suivi et le scellement des contrats de licence SaaS Restaurant OS.
 */
export class DocuSealService {
  private static getApiUrl(): string {
    return process.env.DOCUSEAL_API_URL?.replace(/\/$/, '') || 'https://api.docuseal.com';
  }

  private static getApiKey(): string | null {
    return process.env.DOCUSEAL_API_KEY || null;
  }

  /**
   * Vérifie si les identifiants de production DocuSeal sont configurés.
   */
  static isConfigured(): boolean {
    return Boolean(process.env.DOCUSEAL_API_KEY && process.env.DOCUSEAL_API_KEY.trim().length > 0);
  }

  /**
   * Teste la connectivité et la santé du serveur DocuSeal.
   */
  static async checkHealth(): Promise<{ online: boolean; message: string; apiUrl: string }> {
    const apiUrl = this.getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        return { online: true, message: 'DocuSeal opérationnel et joignable', apiUrl };
      }
      return { online: false, message: `Réponse serveur DocuSeal inattendue (code ${res.status})`, apiUrl };
    } catch {
      return { online: false, message: 'Serveur DocuSeal non joignable (mode Sandbox actif)', apiUrl };
    }
  }

  /**
   * Enregistre automatiquement le webhook Restaurant OS dans DocuSeal au démarrage sans intervention manuelle.
   */
  static async autoConfigureWebhook(appBaseUrl?: string): Promise<boolean> {
    const apiKey = this.getApiKey();
    const apiUrl = this.getApiUrl();
    if (!apiKey) return false;

    const base = (appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://app.restaurantos.app').replace(/\/$/, '');
    const targetWebhookUrl = `${base}/api/webhooks/docuseal`;

    try {
      // 1. Lister les webhooks existants
      const listRes = await fetch(`${apiUrl}/api/v1/webhooks`, {
        headers: { 'X-Auth-Token': apiKey, 'Content-Type': 'application/json' },
      });

      if (listRes.ok) {
        const existing = (await listRes.json()) as Array<{ url: string }>;
        if (Array.isArray(existing) && existing.some((w) => w.url === targetWebhookUrl)) {
          logger.info(`[DocuSeal Auto-Plug] Webhook déjà enregistré: ${targetWebhookUrl}`);
          return true;
        }
      }

      // 2. Enregistrer automatiquement le webhook
      const createRes = await fetch(`${apiUrl}/api/v1/webhooks`, {
        method: 'POST',
        headers: { 'X-Auth-Token': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetWebhookUrl,
          events: ['submission.created', 'submission.opened', 'submission.completed'],
        }),
      });

      if (createRes.ok) {
        logger.info(`[DocuSeal Auto-Plug] ✅ Webhook automatiquement configuré sur ${targetWebhookUrl}`);
        return true;
      }
      return false;
    } catch (err) {
      logger.warn('[DocuSeal Auto-Plug] Impossible d auto-enregistrer le webhook:', err);
      return false;
    }
  }

  /**
   * Crée une soumission de signature électronique DocuSeal à partir d'un contrat Restaurant OS.
   */
  static async createSubmission(
    contract: ContractRecord,
    options?: { sendEmail?: boolean; sendSms?: boolean; customMessage?: string }
  ): Promise<DocuSealSubmissionResponse> {
    const apiKey = this.getApiKey();
    const apiUrl = this.getApiUrl();
    const signer = contract.client;

    const signingUrlBase = process.env.NEXT_PUBLIC_APP_URL || 'https://app.restaurantos.app';
    const fallbackSigningUrl = `${signingUrlBase}/contracts/sign/${contract.id}?token=${contract.signingToken}`;

    // Mode Sandbox / Simulation si pas de clé API fournie (Développement local / Tests CI)
    if (!apiKey) {
      const mockId = Math.floor(100000 + Math.random() * 900000);
      const mockSlug = `ds_${contract.id.toLowerCase()}_${mockId}`;

      logger.info(
        `[DocuSeal] Mode Sandbox — Soumission simulée créée pour ${signer.representativeName} (${signer.email}) — Contrat ${contract.id}`
      );

      return {
        id: mockId,
        slug: mockSlug,
        status: 'pending',
        submitters: [
          {
            id: mockId * 10 + 1,
            slug: mockSlug,
            email: signer.email,
            phone: signer.phone,
            status: 'pending',
            embed_url: `${apiUrl}/s/${mockSlug}`,
            signing_url: fallbackSigningUrl,
          },
        ],
        documents: [
          {
            name: `Contrat_RestaurantOS_${contract.id}.pdf`,
            url: `${signingUrlBase}/api/tenant/contracts/${contract.id}/download`,
          },
        ],
      };
    }

    // Appel effectif à l'API DocuSeal
    const payload = {
      name: `Contrat de Licence SaaS — ${signer.companyName} (${contract.id})`,
      send_email: options?.sendEmail ?? true,
      send_sms: options?.sendSms ?? Boolean(signer.phone),
      message: options?.customMessage || {
        subject: `Signature de votre contrat Restaurant OS — ${signer.companyName}`,
        body: `Bonjour ${signer.representativeName},\n\nVoici le lien sécurisé pour signer électroniquement votre contrat d'abonnement Restaurant OS pour votre établissement ${signer.companyName}.\n\nCe document inclut la mise à disposition de vos outils d'exploitation et la licence de caisse NF525.`,
      },
      submitters: [
        {
          name: signer.representativeName,
          email: signer.email,
          phone: signer.phone,
          role: 'Client',
          fields: [
            { name: 'CompanyName', default_value: signer.companyName, readonly: true },
            { name: 'Siren', default_value: signer.siren, readonly: true },
            { name: 'PlanName', default_value: contract.pricing.planName, readonly: true },
            { name: 'MonthlyPrice', default_value: `${contract.pricing.monthlyPriceInEuros} € HT`, readonly: true },
          ],
        },
      ],
      html: this.renderContractHtml(contract),
    };

    try {
      const response = await fetch(`${apiUrl}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur API DocuSeal (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as DocuSealSubmissionResponse;

      empireAudit.log({
        module: 'legal',
        action: 'DOCUSEAL_SUBMISSION_CREATED',
        details: {
          contractId: contract.id,
          submissionId: data.id,
          signerEmail: signer.email,
          signerPhone: signer.phone,
          status: data.status,
        },
        severity: 'medium',
        timestamp: new Date(),
      });

      return data;
    } catch (err) {
      logger.error(`[DocuSeal] Échec de création de la soumission pour ${contract.id}`, err);
      throw err;
    }
  }

  /**
   * Convertit le document contractuel structuré en HTML propre pour le moteur DocuSeal.
   */
  private static renderContractHtml(contract: ContractRecord): string {
    const doc = contract.document;
    const sectionsHtml = doc.sections
      .map(
        (s) => `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            ${s.title}
          </h3>
          <p style="font-size: 12px; line-height: 1.6; color: #334155; white-space: pre-wrap;">
            ${s.content}
          </p>
        </div>`
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${doc.title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; padding: 40px; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${doc.title}</h1>
          <p style="font-size: 12px; color: #64748b;">Référence : ${doc.contractId} • Version ${doc.version}</p>
        </div>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 32px; font-size: 12px;">
          <strong>Établissement :</strong> ${contract.client.companyName} (SIREN: ${contract.client.siren})<br/>
          <strong>Représentant légal :</strong> ${contract.client.representativeName} (${contract.client.representativeRole})<br/>
          <strong>Forfait souscrit :</strong> ${contract.pricing.planName} (${contract.pricing.monthlyPriceInEuros} € HT / mois)
        </div>

        ${sectionsHtml}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #0f172a;">
          <h4 style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">SIGNATURE ÉLECTRONIQUE DU CLIENT</h4>
          <p style="font-size: 11px; color: #64748b;">En signant ci-dessous, le Client accepte sans réserve l'intégralité des clauses du Contrat, des CGU/CGV et de l'accord DPA RGPD.</p>
          <div style="margin-top: 20px; padding: 20px; border: 1px dashed #94a3b8; border-radius: 6px; text-align: center; color: #64748b; font-size: 12px;">
            Champ de signature DocuSeal
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
