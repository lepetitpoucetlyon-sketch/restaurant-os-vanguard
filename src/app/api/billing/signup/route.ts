import 'server-only';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/billing/signup — DÉSACTIVÉ (410 Gone)
 *
 * Cette route publique permettait à quiconque d'ouvrir une session Stripe
 * Checkout pour créer un tenant depuis une landing page publique.
 *
 * Décision produit (mémoire project_provisioning_mcc_only.md) :
 * la création de tenant passe EXCLUSIVEMENT par le MCC — aucun canal de
 * self-provisioning depuis une landing. La landing page est en pause.
 *
 * La route reste montée pour renvoyer un 410 Gone explicite (utile pour
 * détecter d'éventuels appels legacy en télémétrie), plutôt qu'un 404.
 *
 * À ré-activer uniquement si le canal self-provisioning est ré-ouvert
 * — auquel cas ajouter obligatoirement :
 *   - rate-limit via getRateLimiter()
 *   - validation Zod stricte (schéma SIRET + email + tier)
 *   - CAPTCHA côté client
 */
export async function POST(): Promise<NextResponse> {
    logger.warn('[billing/signup] Route désactivée (410 Gone) — MCC-only provisioning enforced');
    return NextResponse.json(
        {
            error: 'GONE',
            message: 'Le self-provisioning public est désactivé. Contactez le support pour créer un tenant.',
        },
        { status: 410 },
    );
}
