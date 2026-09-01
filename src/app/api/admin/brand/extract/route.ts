import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';

const BodySchema = z.object({
  url: z.string().url(),
});

/**
 * POST /api/admin/brand/extract
 * Prend l'URL du site du restaurant, capture un screenshot via Playwright,
 * l'analyse avec Gemini Vision et retourne les tokens de marque extraits.
 * Auth : JWT vérifié — le tenant vient du token, plus du body.
 */
export async function POST(req: NextRequest) {
  try {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller;
    const tenantId = caller.tenantId;

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
    }

    const { url } = parsed.data;

    if (!process.env.GEMINI_API_KEY && !process.env.LLM_API_KEY) {
      return NextResponse.json({ error: 'LLM_API_KEY non configuré' }, { status: 500 });
    }

    logger.info(`[BrandExtract] Extraction pour ${tenantId} → ${url}`);

    const { BrandingService } = await import('@/modules/intelligence');
    const brandInput = await BrandingService.extractFromUrl(url);

    // Mapper vers BrandConfig partiel
    const tokens = {
      brandName:    brandInput.name,
      primaryColor: brandInput.primaryColor ?? undefined,
      // Atmosphère → surface colors
      ...(brandInput.atmosphere === 'luxury' && {
        surfaceBg:    '#0A0A0A',
        surfaceCard:  '#1A1A1A',
        fontBrand:    'Playfair Display',
        fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&display=swap',
      }),
      ...(brandInput.atmosphere === 'bistro' && {
        surfaceBg:    '#FAF7F2',
        surfaceCard:  '#F0EBE1',
        fontBrand:    'Lora',
        fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Lora:ital@0;1&display=swap',
      }),
      ...(brandInput.atmosphere === 'fast-food' && {
        surfaceBg:    '#FFFFFF',
        surfaceCard:  '#F5F5F5',
        fontBrand:    'Poppins',
        fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap',
      }),
    };

    logger.info(`[BrandExtract] Succès`, { tokens });

    return NextResponse.json({ success: true, tokens });

  } catch (error) {
    logger.error('[BrandExtract] Échec', error);
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
