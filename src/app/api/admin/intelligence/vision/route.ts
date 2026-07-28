import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';

// ~12 Mo de base64 ≈ 9 Mo d'image décodée — au-delà, on refuse (DoS mémoire).
const MAX_B64_LEN = 12 * 1024 * 1024;

const VisionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('ANALYZE_INVOICE'),
    payload: z.object({ base64Image: z.string().min(1).max(MAX_B64_LEN) }),
  }),
  z.object({
    action: z.literal('COMPLIANCE_SCAN'),
    payload: z.object({ base64Image: z.string().min(1).max(MAX_B64_LEN), trustedContext: z.boolean().default(false) }),
  }),
  z.object({
    action: z.literal('COMPARE_PLATE'),
    payload: z.object({ base64Image: z.string().min(1).max(MAX_B64_LEN), recipeName: z.string().min(1).max(200) }),
  }),
]);

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
       const { InvoiceExtractionService } = await import('@/modules/logistics/services/InvoiceExtractionService');
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

    if (action === 'COMPARE_PLATE') {
      const { LLMManager } = await import('@/modules/intelligence/ai');
      const { AI_MODELS } = await import('@/modules/intelligence/ai');
      const imageData = payload.base64Image.includes(',') ? payload.base64Image.split(',')[1] : payload.base64Image;
      const response = await LLMManager.provider.generateFromImage({
        model: AI_MODELS.visionFast,
        systemPrompt: `Tu es un chef de cuisine expert en contrôle qualité. Analyse la photo d'un plat et réponds UNIQUEMENT en JSON valide.`,
        userPrompt: `Évalue ce plat "${payload.recipeName}". Réponds en JSON: {"score": number (1-10), "isCompliant": boolean, "feedback": string[], "detectedIssues": string[]}`,
        image: { base64: imageData, mimeType: 'image/jpeg' },
        temperature: 0.2,
        maxTokens: 512,
        responseMimeType: 'application/json',
      });
      try {
        const data = JSON.parse(response.text) as unknown;
        return NextResponse.json({ success: true, data });
      } catch {
        return NextResponse.json({ success: false, error: 'JSON parse error', raw: response.text }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: unknown) {
    logger.error('[Vision API] Pipeline failure', error);
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
