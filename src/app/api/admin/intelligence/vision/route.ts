import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';

// ~12 Mo de base64 ≈ 9 Mo d'image décodée — au-delà, on refuse (DoS mémoire).
const MAX_B64_LEN = 12 * 1024 * 1024;

const VisionSchema = z.object({
  action: z.enum(['ANALYZE_INVOICE', 'COMPLIANCE_SCAN']),
  payload: z.object({
    base64Image: z.string().min(1).max(MAX_B64_LEN),
    trustedContext: z.boolean().default(false),
  }),
});

/**
 * 🛰️ Vision API Proxy - Grade X Sovereign Gateway
 * Proxies Gemini Vision requests from the client to the Google Cloud.
 * This ensures API keys NEVER leak to the browser.
 * Auth : JWT vérifié — le tenant facturé vient du token, pas du payload.
 */
export async function POST(req: NextRequest) {
  try {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller;

    const parsed = VisionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }
    const { action, payload } = parsed.data;

    const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logger.error('[Vision API] Critical failure: LLM_API_KEY is not configured on the server.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Proxy the request based on action
    if (action === 'ANALYZE_INVOICE') {
       const { InvoiceExtractionService } = await import('@/domain/services/InvoiceExtractionService');
       const result = await InvoiceExtractionService.extractFromImage(payload.base64Image, {
         tenantId: caller.tenantId
       });
       return NextResponse.json(result);
    }

    if (action === 'COMPLIANCE_SCAN') {
       const { IdentityGuardService } = await import('@/domain/services/IdentityGuardService');
       const result = await IdentityGuardService.scanDocument(payload.base64Image, {
         tenantId: caller.tenantId,
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
