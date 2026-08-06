/**
 * imageParser — OCR via LLMManager.generateFromImage (provider agnostique).
 * Supporte JPEG, PNG, WebP, GIF.
 * Retourne le JSON structuré selon la catégorie d'import.
 */

import { LLMManager } from '@/modules/intelligence/ia/ai/LLMManager';
import { AI_MODELS } from '@/modules/intelligence/ia/ai/LLMProviderFactory';
import { getOcrPrompt } from './ocrPrompts';
import type { ImportCategory } from '../types';

export interface OcrResult {
    raw: string;
    parsed: unknown;
    confidence: 'high' | 'medium' | 'low';
}

/**
 * Encode un File/Blob en base64.
 */
async function fileToBase64(file: File | Blob): Promise<string> {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
}

/**
 * Détecte le mimeType à partir du fichier.
 */
function detectMimeType(file: File): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'image/jpeg';
}

/**
 * Extrait du JSON depuis la réponse brute du LLM.
 * Robuste aux balises ```json … ``` et au texte parasite.
 */
function extractJSON(raw: string): unknown {
    let text = raw.trim();
    // Supprime les balises markdown code
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    // Essaie de trouver le premier objet JSON
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
        text = text.slice(start, end + 1);
    }
    return JSON.parse(text);
}

export async function parseImageWithOCR(
    file: File,
    category: ImportCategory,
    additionalContext?: string,
): Promise<OcrResult> {
    const [base64, mimeType] = await Promise.all([
        fileToBase64(file),
        Promise.resolve(detectMimeType(file)),
    ]);

    const prompt = getOcrPrompt(category, additionalContext);

    const response = await LLMManager.provider.generateFromImage({
        model: AI_MODELS.visionFast,
        userPrompt: prompt,
        image: { base64, mimeType },
        temperature: 0.1,
        maxTokens: 4096,
        responseMimeType: 'application/json',
    });

    try {
        const parsed = extractJSON(response.text);
        return { raw: response.text, parsed, confidence: 'high' };
    } catch {
        // JSON invalide — retour en mode low-confidence avec le texte brut
        return { raw: response.text, parsed: null, confidence: 'low' };
    }
}
