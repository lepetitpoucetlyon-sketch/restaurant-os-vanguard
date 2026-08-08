import { NextRequest, NextResponse } from 'next/server';
import { BrandingService } from '@/lib/BrandingService';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';

export async function POST(request: NextRequest) {
  // Extraction de marque = feature admin/settings — requiert un utilisateur authentifié.
  // Sans ce guard, n'importe qui peut déclencher une capture Playwright + appel Gemini.
  const authResult = await requireTenantUser(request);
  if (isDenied(authResult)) return authResult;

  try {
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL requise' }, { status: 400 });
    }

    const brand = await BrandingService.extractFromUrl(url);
    return NextResponse.json(brand);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction échouée';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
