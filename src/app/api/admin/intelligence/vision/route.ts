import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * 🛰️ Vision API Proxy - Grade X Sovereign Gateway
 * Proxies Gemini Vision requests from the client to the Google Cloud.
 * This ensures API keys NEVER leak to the browser.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logger.error('[Vision API] Critical failure: GEMINI_API_KEY is not configured on the server.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Proxy the request based on action
    if (action === 'ANALYZE_INVOICE') {
       const { InvoiceExtractionService } = await import('@/domain/services/InvoiceExtractionService');
       const result = await InvoiceExtractionService.extractFromImage(payload.base64Image, { 
         apiKey,
         tenantId: payload.tenantId || 'system'
       });
       return NextResponse.json(result);
    }

    if (action === 'COMPLIANCE_SCAN') {
       const { IdentityGuardService } = await import('@/domain/services/IdentityGuardService');
       const result = await IdentityGuardService.scanDocument(payload.base64Image, { 
         tenantId: payload.tenantId,
         trustedContext: payload.trustedContext 
       });
       // Inject the key since we are on server
       // Note: In IdentityGuardService, we should modify it to accept apiKey as param
       return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: unknown) {
    logger.error('[Vision API] Pipeline failure', error);
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
