import type { JournalLine } from '@nexus/contracts';
import type { CartItem } from '@/modules/ops/workflow/engine/types';
import type { BridgePayload, PaymentMode } from './FinancialNexusBridge';

export const PCG_PAYMENT_ACCOUNTS: Record<PaymentMode, { code: string; name: string }> = {
  cash:         { code: '531000', name: 'Caisse' },
  card:         { code: '512000', name: 'Banque (CB)' },
  check:        { code: '511200', name: 'Chèques à encaisser' },
  ticket_resto: { code: '511500', name: 'Titres-restaurant à encaisser' },
  transfer:     { code: '512000', name: 'Banque (virement)' },
  comp:         { code: '658000', name: 'Charges diverses (Offerts)' },
};

/**
 * Compte PCG des pourboires volontaires.
 * Les pourboires ne sont PAS soumis à la TVA : ils sont crédités ici,
 * hors base taxable, et n'entrent jamais dans `computeTtcByRateAndAxis`.
 */
export const PCG_TIP_ACCOUNT = { code: '708500', name: 'Pourboires collectés' } as const;

export const microToCents = (mu: number): number => Math.round(mu / 10_000);

export function computeTtcByRateAndAxis(
  items: (CartItem & { taxRate: string; analyticalAxis: string })[]
): Record<string, { ttcMu: number; tvaMu: number }> {
  const result: Record<string, { ttcMu: number; tvaMu: number }> = {};
  for (const item of items) {
    const key = `${item.taxRate}_${item.analyticalAxis}`;
    const lineTTC = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
    const rateNum = parseFloat(String(item.taxRate ?? '0.10'));
    const lineTVA = lineTTC - Math.round(lineTTC / (1 + rateNum));

    if (!result[key]) {
      result[key] = { ttcMu: 0, tvaMu: 0 };
    }
    result[key].ttcMu += lineTTC;
    result[key].tvaMu += lineTVA;
  }
  return result;
}

export function makeLine(
  accountCode: string,
  accountName: string,
  side: 'debit' | 'credit',
  cents: number,
  description: string,
  pieceNumber: string,
  now: string,
  analyticalAxis?: string,
): JournalLine {
  return {
    accountId: accountCode,
    accountCode,
    accountName,
    description,
    side,
    amountInCents: cents,
    amountInMicrounits: cents * 10_000,
    date: now,
    pieceNumber,
    debitInCents: side === 'debit' ? cents : 0,
    debitInMicrounits: side === 'debit' ? cents * 10_000 : 0,
    creditInCents: side === 'credit' ? cents : 0,
    creditInMicrounits: side === 'credit' ? cents * 10_000 : 0,
    runningBalanceInCents: 0,
    runningBalanceInMicrounits: 0,
    ...(analyticalAxis ? { analyticalAxis } : {}),
  };
}

export function buildJournalLines(
  ttcByRateAndAxis: Record<string, { ttcMu: number; tvaMu: number }>,
  payload: BridgePayload,
  pieceNumber: string,
  now: string
): JournalLine[] {
  const credits: JournalLine[] = [];
  let totalCreditCents = 0;

  for (const [rateAndAxis, { ttcMu, tvaMu }] of Object.entries(ttcByRateAndAxis)) {
    const [rateStr, axis] = rateAndAxis.split('_');
    const ratePercent = (parseFloat(rateStr) * 100).toFixed(1).replace('.0', '');
    const htMu = ttcMu - tvaMu;
    const htCents = microToCents(htMu);
    const tvaCents = microToCents(tvaMu);

    credits.push(
      makeLine(
        '707000',
        `Ventes de marchandises (${axis.toUpperCase()})`,
        'credit',
        htCents,
        `Vente POS — Axe ${axis}`,
        pieceNumber,
        now,
        axis
      )
    );

    credits.push(
      makeLine(
        '445710',
        `TVA collectée (${ratePercent}%)`,
        'credit',
        tvaCents,
        `TVA ${ratePercent}% sur vente POS`,
        pieceNumber,
        now,
        axis
      )
    );

    totalCreditCents += htCents + tvaCents;
  }

  // ── Pourboire — hors base TVA (§7.4) ────────────────────────────────────────
  // Crédité sur 708500, jamais sur 707000/445710 : un pourboire volontaire
  // n'est pas soumis à la TVA. Le débit correspondant est ajouté plus bas pour
  // que `Σ débits = Σ crédits = montant réellement encaissé au terminal`.
  const tipCents = microToCents(payload.tipInMicrounits ?? 0);

  if (tipCents > 0) {
    credits.push(
      makeLine(
        PCG_TIP_ACCOUNT.code,
        PCG_TIP_ACCOUNT.name,
        'credit',
        tipCents,
        'Pourboire volontaire — hors TVA',
        pieceNumber,
        now
      )
    );
  }

  const debits: JournalLine[] = [];

  if (payload.partialPayments && payload.partialPayments.length > 0) {
    for (const p of payload.partialPayments) {
      const modeKey = (p.method as PaymentMode) || payload.paymentMode || 'card';
      const acct = PCG_PAYMENT_ACCOUNTS[modeKey] ?? PCG_PAYMENT_ACCOUNTS.card;
      debits.push(
        makeLine(
          acct.code,
          acct.name,
          'debit',
          p.amount,
          `Paiement partiel (${modeKey}) — Convive ${p.guest}`,
          pieceNumber,
          now
        )
      );
    }
  } else {
    const modeKey = payload.paymentMode || 'card';
    const acct = PCG_PAYMENT_ACCOUNTS[modeKey] ?? PCG_PAYMENT_ACCOUNTS.card;
    debits.push(
      makeLine(
        acct.code,
        acct.name,
        'debit',
        totalCreditCents,
        `Règlement POS (${acct.name})`,
        pieceNumber,
        now
      )
    );
  }

  // Le pourboire est encaissé sur le même moyen de paiement que la note.
  // Ligne de débit dédiée : elle rend l'écart traçable en rapprochement bancaire
  // et fonctionne aussi bien en paiement simple qu'en note partagée.
  if (tipCents > 0) {
    const tipModeKey = payload.paymentMode || 'card';
    const tipAcct = PCG_PAYMENT_ACCOUNTS[tipModeKey] ?? PCG_PAYMENT_ACCOUNTS.card;
    debits.push(
      makeLine(
        tipAcct.code,
        tipAcct.name,
        'debit',
        tipCents,
        `Pourboire encaissé (${tipAcct.name})`,
        pieceNumber,
        now
      )
    );
  }

  return [...debits, ...credits];
}
