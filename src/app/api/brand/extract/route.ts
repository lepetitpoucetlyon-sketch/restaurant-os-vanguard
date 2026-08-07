import { NextRequest, NextResponse } from 'next/server';
import { BrandingService } from '@/lib/BrandingService';

export async function POST(request: NextRequest) {
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
