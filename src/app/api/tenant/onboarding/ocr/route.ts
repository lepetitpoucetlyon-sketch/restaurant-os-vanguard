/**
 * POST /api/tenant/onboarding/ocr
 * Body: FormData { file: File, category: ImportCategory, context?: string }
 * → OCR via LLMManager (agnostique), retourne JSON structuré.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';
import { parseImageWithOCR, parsePDFWithOCR } from '@/modules/commerce';
import type { ImportCategory } from '@nexus/contracts';
import { LLMManager } from '@/modules/intelligence/ia/ai/LLMManager';
import { createLLMProvider } from '@/modules/intelligence/ia/ai/LLMProviderFactory';
import { toError } from "@/lib/toError";

// Bootstrap du provider si pas encore fait
if (!LLMManager['_provider']) {
    LLMManager.provider = createLLMProvider();
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

export async function POST(req: NextRequest) {
    const caller = await requireTenantUser(req);
    if (isDenied(caller)) return caller;

    try {
        const form = await req.formData();
        const file = form.get('file') as File | null;
        const category = form.get('category') as ImportCategory | null;
        const context  = form.get('context') as string | null;

        if (!file || !category) {
            return NextResponse.json({ error: 'file et category sont requis' }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 413 });
        }

        logger.info('[onboarding/ocr] Traitement', { tenantId: caller.tenantId, category, size: file.size, type: file.type });

        const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        const result = isPDF
            ? await parsePDFWithOCR(file, category, context ?? undefined)
            : await parseImageWithOCR(file, category, context ?? undefined);

        return NextResponse.json({
            ok: result.confidence !== 'low',
            confidence: result.confidence,
            parsed: result.parsed,
            raw: result.confidence === 'low' ? result.raw : undefined,
        });
    } catch (err) {
        logger.error('[onboarding/ocr]', err);
        return NextResponse.json({ error: toError(err).message }, { status: 500 });
    }
}
