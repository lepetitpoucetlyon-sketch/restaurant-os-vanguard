/**
 * pdfParser — extraction de texte PDF + OCR via TenantAIRegistry (ADR-008 Phase C).
 *
 * Stratégie :
 *  1. Essaie d'extraire le texte brut du PDF (PDFs natifs/textuels).
 *  2. Si le texte extrait est trop court (<50 chars), envoie la première page
 *     comme image via registry.provider.generateFromImage (PDF scanné).
 *
 * Requiert tenantId (isolation IA par tenant — ADR-008).
 */

import { TenantAIRegistry } from '@/kernel/ai/tenant';
import { getOcrPrompt } from './ocrPrompts';
import type { ImportCategory } from '../types';
import type { OcrResult } from './imageParser';

const CALLER = 'modules/commerce/acquisition/onboarding/migration/parsers/pdfParser';

/**
 * Tente d'extraire le texte brut d'un PDF sans dépendance externe.
 * Utilise une regex basique pour lire les streams texte PDF.
 * Fiable pour les PDFs textuels, nul pour les PDFs scannés.
 */
async function extractRawTextFromPDF(file: File): Promise<string> {
    const text = await file.text();
    const matches = text.match(/BT[\s\S]*?ET/g) ?? [];
    const extracted = matches
        .join(' ')
        .replace(/\(([^)]+)\)\s*Tj/g, '$1 ')
        .replace(/[^\x20-\x7EÀ-ɏ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return extracted;
}

/**
 * Encode le premier "chunk" d'un PDF en base64 pour envoi vision.
 * On envoie les 200 Ko (suffisant pour une page d'un PDF image).
 */
async function pdfFirstPageAsBase64(file: File): Promise<string> {
    const chunk = file.slice(0, 200_000);
    const buf = await chunk.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
}

function extractJSON(raw: string): unknown {
    let text = raw.trim();
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) text = text.slice(start, end + 1);
    return JSON.parse(text);
}

export async function parsePDFWithOCR(
    file: File,
    category: ImportCategory,
    additionalContext?: string,
    tenantId?: string,
): Promise<OcrResult> {
    if (!tenantId) {
        throw new Error('[parsePDFWithOCR] tenantId requis (ADR-008 Phase C — isolation IA)');
    }
    const prompt = getOcrPrompt(category, additionalContext);

    // Étape 1 : extraction texte natif
    const rawText = await extractRawTextFromPDF(file);

    if (rawText.length >= 50) {
        // PDF textuel → on envoie le texte directement via le registre tenant (fast context)
        const registry = await TenantAIRegistry.forTenant(tenantId, CALLER, 'fast');
        const response = await registry.provider.generateText({
            model: '',
            userPrompt: `${prompt}\n\nContenu du PDF:\n${rawText.slice(0, 15_000)}`,
            temperature: 0.1,
            maxTokens: 4096,
        });
        try {
            const parsed = extractJSON(response.text);
            return { raw: response.text, parsed, confidence: 'high' };
        } catch {
            return { raw: response.text, parsed: null, confidence: 'low' };
        }
    }

    // Étape 2 : PDF scanné → vision LLM tenant-scoped
    const base64 = await pdfFirstPageAsBase64(file);
    const visionRegistry = await TenantAIRegistry.forTenant(tenantId, CALLER, 'vision');
    const response = await visionRegistry.provider.generateFromImage({
        model: '',
        userPrompt: prompt,
        image: { base64, mimeType: 'application/pdf' },
        temperature: 0.1,
        maxTokens: 4096,
    });

    try {
        const parsed = extractJSON(response.text);
        return { raw: response.text, parsed, confidence: 'medium' };
    } catch {
        return { raw: response.text, parsed: null, confidence: 'low' };
    }
}
