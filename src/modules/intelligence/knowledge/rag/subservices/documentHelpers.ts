import type { KnowledgeEntityType, KnowledgeQuery } from '../types';
import type { LightRAGQueryMode } from '../LightRAGConfig';

export function documentToText(
    type: KnowledgeEntityType,
    doc: Record<string, unknown>
): string | null {
    const id = doc.id as string;
    if (!id) return null;

    const name = (doc.name ?? doc.label ?? doc.description ?? id) as string;
    const parts: string[] = [`[${type.toUpperCase()}] ${name}`];

    const textFields = [
        'description', 'category', 'type', 'status',
        'notes', 'instructions', 'tags',
    ];

    for (const field of textFields) {
        const value = doc[field];
        if (value && typeof value === 'string') {
            parts.push(`${field}: ${value}`);
        }
    }

    const numericFields = [
        'priceInCents', 'costInCents', 'quantity', 'weight',
    ];

    for (const field of numericFields) {
        const value = doc[field];
        if (typeof value === 'number') {
            parts.push(`${field}: ${value}`);
        }
    }

    const ingredients = doc.ingredients as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(ingredients)) {
        const ingredientText = ingredients
            .map(ing => `${ing.name ?? ing.ingredientId} (${ing.quantity ?? ''} ${ing.unit ?? ''})`.trim())
            .join(', ');
        parts.push(`Ingrédients: ${ingredientText}`);
    }

    if (doc.supplierName) {
        parts.push(`Fournisseur: ${doc.supplierName}`);
    }

    return parts.join('\n');
}

export function resolveQueryMode(query: KnowledgeQuery): LightRAGQueryMode {
    if (query.focusTypes && query.focusTypes.length === 1) {
        return 'local';
    }

    const relationKeywords = ['entre', 'between', 'lien', 'relation', 'comparaison', 'compare'];
    const lower = query.question.toLowerCase();
    if (relationKeywords.some(kw => lower.includes(kw))) {
        return 'hybrid';
    }

    return 'mix';
}

export async function hashTenantId(tenantId: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(tenantId + '_sovereign_salt_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    let hash = 0;
    const str = tenantId + '_sovereign_salt_2026';
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `tenant_${Math.abs(hash).toString(16)}`;
}
