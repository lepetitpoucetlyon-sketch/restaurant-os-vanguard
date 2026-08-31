import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BrandingService } from '@/lib/BrandingService';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { getRateLimiter } from '@/infrastructure/services/rate-limiter';

const ExtractSchema = z.object({
  url: z.string().url().max(2048),
});

export async function POST(request: NextRequest) {
  // Extraction de marque = feature admin/settings — requiert un utilisateur authentifié.
  // Sans ce guard, n'importe qui peut déclencher une capture Playwright + appel Gemini.
  const authResult = await requireTenantUser(request);
  if (isDenied(authResult)) return authResult;

  // P1-B : rate-limit anti-flood (extraction = Playwright + LLM, coûteuse).
  // 20 extractions/heure/utilisateur.
  const rl = await getRateLimiter().check(
    `brand-extract:${authResult.tenantId}:${authResult.uid}`,
    20,
    60 * 60 * 1000,
  );
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop d’extractions — réessayez dans 1h.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = ExtractSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'URL invalide', details: parsed.error.flatten() }, { status: 400 });
    }
    const { url } = parsed.data;

    const brand = await BrandingService.extractFromUrl(url);
    return NextResponse.json(brand);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction échouée';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
