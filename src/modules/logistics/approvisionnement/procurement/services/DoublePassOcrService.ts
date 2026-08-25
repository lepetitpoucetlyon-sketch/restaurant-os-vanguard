import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { getSetting } from '@/lib/settings/SettingsReader';

export interface RawOcrPassResult {
  extractedText: string;
  detectedTotalTtc?: number;
  detectedInvoiceNumber?: string;
  ocrConfidence: number; // 0 - 100
}

export interface DoublePassOcrDecision {
  invoiceId: string;
  isReliable: boolean;
  confidencePct: number;
  extractedTotalTtcInMicrounits: number;
  extractedInvoiceNumber: string;
  requiresManualReview: boolean;
}

/**
 * DoublePassOcrService — Angle mort L29 (DF-J4).
 * OCR double passe avec filtrage/débruitage sur factures et bons de livraison dégradés : déclenche la revue manuelle si confiance sous le seuil configuré.
 */
export class DoublePassOcrService {
  static evaluatePasses(
    tenantId: string,
    invoiceId: string,
    pass1: RawOcrPassResult,
    pass2: RawOcrPassResult
  ): DoublePassOcrDecision {
    const avgConfidence = Math.round((pass1.ocrConfidence + pass2.ocrConfidence) / 2);
    const minConfidence = getSetting<number>('inventory', 'ocr_confidence_threshold', 90);
    const isReliable = avgConfidence >= minConfidence && pass1.detectedTotalTtc === pass2.detectedTotalTtc;

    const totalEuro = pass2.detectedTotalTtc ?? pass1.detectedTotalTtc ?? 0;
    const extractedTotalTtcInMicrounits = Math.round(totalEuro * 1_000_000);
    const extractedInvoiceNumber = pass2.detectedInvoiceNumber || pass1.detectedInvoiceNumber || 'INV-UNKNOWN';

    NexusEventBus.emit('stock.double_pass_ocr_processed', {
      v: 1,
      tenantId,
      invoiceId,
      confidencePct: avgConfidence,
      requiresManualReview: !isReliable,
      processedAt: Date.now(),
    });

    return {
      invoiceId,
      isReliable,
      confidencePct: avgConfidence,
      extractedTotalTtcInMicrounits,
      extractedInvoiceNumber,
      requiresManualReview: !isReliable,
    };
  }
}
