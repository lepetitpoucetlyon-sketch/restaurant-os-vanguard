import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';

const BodySchema = z.object({
  reviewText: z.string().min(1).max(5000),
  rating: z.number().int().min(1).max(5),
  businessName: z.string().min(1).max(200),
});

const GEMINI_BASE_URL =
  process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-1.5-flash';

/**
 * POST /api/ai/review-response
 * Génère une réponse professionnelle à un avis Google via Gemini.
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

    const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
    if (!apiKey) {
      logger.error('[ReviewResponse] GEMINI_API_KEY non configuré');
      return NextResponse.json(
        { error: 'Configuration serveur manquante (clé IA).' },
        { status: 500 }
      );
    }

    const prompt = `Génère une réponse professionnelle et chaleureuse en français à cet avis de restaurant : "${reviewText}". Le restaurant est ${businessName}. Note : ${rating}/5. Sois spécifique au contenu de l'avis.`;

    const geminiRes = await fetch(
      `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      logger.error('[ReviewResponse] Gemini API error', { status: geminiRes.status, body: errText });
      return NextResponse.json(
        { error: `Erreur IA (${geminiRes.status})` },
        { status: 502 }
      );
    }

    const data = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    if (data.error) {
      return NextResponse.json({ error: data.error.message ?? 'Erreur IA' }, { status: 502 });
    }

    const response = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!response) {
      return NextResponse.json({ error: 'Réponse vide de l\'IA' }, { status: 502 });
    }

    logger.info('[ReviewResponse] Réponse générée avec succès');
    return NextResponse.json({ response });
  } catch (error) {
    logger.error('[ReviewResponse] Erreur', error);
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
