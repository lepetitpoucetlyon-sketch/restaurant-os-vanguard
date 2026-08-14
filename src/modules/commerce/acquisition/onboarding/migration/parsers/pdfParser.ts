/**
 * pdfParser — extraction de texte PDF + OCR via LLM agnostique.
 *
 * Stratégie :
 *  1. Essaie d'extraire le texte brut du PDF (PDFs natifs/textuels).
 *  2. Si le texte extrait est trop court (<50 chars), envoie la première page
 *     comme image via LLMManager.generateFromImage (PDF scanné).
 */

import { LLMManager, AI_MODELS } from '@/modules/intelligence';
import { getOcrPrompt } from './ocrPrompts';
import type { ImportCategory } from '../types';
import type { OcrResult } from './imageParser';

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
): Promise<OcrResult> {
    const prompt = getOcrPrompt(category, additionalContext);

    // Étape 1 : extraction texte natif
    const rawText = await extractRawTextFromPDF(file);

    if (rawText.length >= 50) {
        // PDF textuel → on envoie le texte directement
        const response = await LLMManager.provider.generateText({
            model: AI_MODELS.fast,
            userPrompt: `${prompt}\n\nContenu du PDF:\n${rawText.slice(0, 15_000)}`,
            temperature: 0.1,
            maxTokens: 4096,
        });
        try {
            const parsed = extractJSON(response.text);
            return { raw: response.text, parsed, confidence: 'high' };
        } catch (err) {
            // eslint-disable-next-line no-console
            console.debug('[pdfParser] extractJSON étape-1 échoué — low-confidence', String(err));
            return { raw: response.text, parsed: null, confidence: 'low' };
        }
    }

    // Étape 2 : PDF scanné → vision LLM
    const base64 = await pdfFirstPageAsBase64(file);
    const response = await LLMManager.provider.generateFromImage({
        model: AI_MODELS.visionFast,
        userPrompt: prompt,
        image: { base64, mimeType: 'application/pdf' },
        temperature: 0.1,
        maxTokens: 4096,
    });

    try {
        const parsed = extractJSON(response.text);
        return { raw: response.text, parsed, confidence: 'medium' };
    } catch (err) {
        // eslint-disable-next-line no-console
        console.debug('[pdfParser] extractJSON étape-2 échoué — low-confidence', String(err));
        return { raw: response.text, parsed: null, confidence: 'low' };
    }
}
