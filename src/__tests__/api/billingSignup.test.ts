/**
 * POST /api/billing/signup — désactivé (410 Gone).
 *
 * Décision produit (audit sécurité API 2026-08-31) : la création de tenant
 * passe EXCLUSIVEMENT par le MCC, aucun canal de self-provisioning depuis
 * une landing publique (cf. mémoire project_provisioning_mcc_only.md).
 *
 * Les tests d'origine du parcours Stripe Checkout ont été retirés avec
 * la logique. À restaurer uniquement si le canal est ré-ouvert.
 */
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/billing/signup/route';

describe('POST /api/billing/signup — désactivé', () => {
  it('renvoie 410 Gone', async () => {
    const res = await POST();
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toBe('GONE');
    expect(body.message.toLowerCase()).toMatch(/support|contactez/);
  });
});
