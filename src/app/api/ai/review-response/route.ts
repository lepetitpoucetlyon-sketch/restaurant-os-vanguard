import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { LLMManager } from '@/modules/intelligence/ia/ai/LLMManager';
import { AIProviderRouter } from '@/modules/intelligence/ia/ai/AIProviderRouter';
import { resolveModelId } from '@/modules/intelligence/ia/ai/LLMProviderFactory';

const BodySchema = z.object({
  reviewText: z.string().min(1).max(5000),
  rating: z.number().int().min(1).max(5),
  businessName: z.string().min(1).max(200),
});

/**
 * POST /api/ai/review-response
 * Génère une réponse professionnelle à un avis client via le moteur LLM universel.
 * Body: { reviewText: string; rating: number; businessName: string }
 * Retourne: { response: string }
 */
export async function POST(req: NextRequest) {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller;

  try {
    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload invalide', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { reviewText, rating, businessName } = parsed.data;

    const prompt = `Génère une réponse professionnelle et chaleureuse en français à cet avis de restaurant : "${reviewText}". Le restaurant est ${businessName}. Note : ${rating}/5. Sois spécifique au contenu de l'avis.`;

    let responseText = '';
    try {
      const response = await LLMManager.provider.generateText({
        model: resolveModelId('fast'),
        userPrompt: prompt,
        temperature: 0.7,
        maxTokens: 512,
      });
      responseText = response.text;
    } catch {
      try {
        const router = new AIProviderRouter();
        const routerRes = await router.generateText(prompt, caller.tenantId, {
          temperature: 0.7,
          maxTokens: 512,
        });
        responseText = routerRes.text;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur IA';
        logger.error('[ReviewResponse] LLM failure', { error: msg });
        return NextResponse.json({ error: `Erreur IA: ${msg}` }, { status: 502 });
      }
    }

    if (!responseText) {
      return NextResponse.json({ error: 'Réponse vide de l\'IA' }, { status: 502 });
    }

    logger.info('[ReviewResponse] Réponse générée avec succès pour tenant', { tenantId: caller.tenantId });
    return NextResponse.json({ response: responseText });
  } catch (error) {
    logger.error('[ReviewResponse] Erreur', error);
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
