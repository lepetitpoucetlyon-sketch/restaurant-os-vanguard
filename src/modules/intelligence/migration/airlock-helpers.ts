import type {
    RawLegacyDocument,
    NormalizedLegacyRecord,
    DuplicateCandidate,
    FiscalValidationResult,
    FiscalIssue,
} from './types';

export const ENTITY_KEYWORDS: Array<{ keywords: string[]; type: NormalizedLegacyRecord['entityType'] }> = [
    { keywords: ['facture', 'invoice', 'vente'],  type: 'transaction' },
    { keywords: ['fournisseur', 'supplier'],       type: 'supplier' },
    { keywords: ['produit', 'product', 'article'], type: 'product' },
    { keywords: ['ingredient', 'matière'],         type: 'ingredient' },
    { keywords: ['employé', 'employee', 'staff'],  type: 'employee' },
    { keywords: ['client', 'customer'],            type: 'customer' },
];

export function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

export function computeSimilarity(a: RawLegacyDocument, b: RawLegacyDocument): number {
    const keysA = Object.keys(a.rawFields);
    const keysB = Object.keys(b.rawFields);
    const commonKeys = keysA.filter(k => keysB.includes(k));

    if (commonKeys.length === 0) return 0;

    let matchCount = 0;
    for (const key of commonKeys) {
        const valA = String(a.rawFields[key] ?? '').toLowerCase().trim();
        const valB = String(b.rawFields[key] ?? '').toLowerCase().trim();

        if (valA === valB && valA !== '') {
            matchCount++;
        } else if (valA.length > 3 && valB.length > 3) {
            const distance = levenshteinDistance(valA, valB);
            const maxLen = Math.max(valA.length, valB.length);
            if (distance / maxLen < 0.2) matchCount += 0.8;
        }
    }

    return matchCount / commonKeys.length;
}

export function getMatchedFields(a: RawLegacyDocument, b: RawLegacyDocument): string[] {
    const matched: string[] = [];
    for (const key of Object.keys(a.rawFields)) {
        if (a.rawFields[key] !== null && a.rawFields[key] === b.rawFields[key]) {
            matched.push(key);
        }
    }
    return matched;
}

export function validateFiscalIntegrity(doc: RawLegacyDocument): FiscalValidationResult {
    const issues: FiscalIssue[] = [];
    const fields = doc.rawFields;

    const amount = Number(fields.amount ?? fields.total ?? fields.montant ?? 0);
    if (amount < 0) {
        issues.push({
            type: 'NEGATIVE_AMOUNT',
            description: 'Negative transaction amount detected',
            actualValue: amount,
            autoFixable: false,
        });
    }

    const ht  = Number(fields.ht  ?? fields.subtotal ?? 0);
    const tva = Number(fields.tva ?? fields.tax ?? 0);
    const ttc = Number(fields.ttc ?? fields.total ?? 0);

    if (ht > 0 && tva > 0 && ttc > 0) {
        const expectedTTC = ht + tva;
        const diff = Math.abs(expectedTTC - ttc);
        if (diff > 1) {
            issues.push({
                type: 'VAT_MISMATCH',
                description: `HT (${ht}) + TVA (${tva}) ≠ TTC (${ttc})`,
                expectedValue: expectedTTC,
                actualValue: ttc,
                autoFixable: diff <= 10,
            });
        }
    }

    return {
        documentId: doc.id,
        vatValid: !issues.some(i => i.type === 'VAT_MISMATCH' && !i.autoFixable),
        totalsBalanced: !issues.some(i => i.type === 'TOTAL_IMBALANCE'),
        requiredFieldsPresent: true,
        issues,
    };
}

export function inferEntityType(
    fields: Record<string, string | number | null>
): NormalizedLegacyRecord['entityType'] | null {
    const allText = [
        ...Object.keys(fields),
        ...Object.values(fields).map(v => String(v ?? '')),
    ].join(' ').toLowerCase();

    return ENTITY_KEYWORDS.find(({ keywords }) => keywords.some(k => allText.includes(k)))?.type ?? null;
}

export function normalizeDocument(doc: RawLegacyDocument): NormalizedLegacyRecord | null {
    const fields = doc.rawFields;
    const fieldMapping: Record<string, string> = {};

    const entityType = inferEntityType(fields);
    if (!entityType) return null;

    const normalized: Record<string, string | number | boolean> = {};

    const FIELD_MAP: Record<string, string> = {
        nom: 'name', name: 'name', designation: 'name', libelle: 'name',
        prix: 'priceInCents', price: 'priceInCents', montant: 'amountInCents',
        categorie: 'category', category: 'category', type: 'category',
        quantite: 'quantity', quantity: 'quantity', qty: 'quantity',
        fournisseur: 'supplierName', supplier: 'supplierName',
        date: 'date', created: 'date',
        statut: 'status', status: 'status',
    };

    for (const [legacyKey, value] of Object.entries(fields)) {
        if (value === null || value === '') continue;
        const normalizedKey = FIELD_MAP[legacyKey.toLowerCase()] ?? legacyKey;
        fieldMapping[legacyKey] = normalizedKey;
        normalized[normalizedKey] = normalizedKey.includes('Cents') && typeof value === 'number'
            ? Math.round(value * 100)
            : value;
    }

    return {
        entityType,
        fields: normalized,
        confidence: Object.keys(fieldMapping).length / Object.keys(fields).length,
        fieldMapping,
    };
}

export function extractDate(doc: RawLegacyDocument): string | null {
    for (const field of ['date', 'created', 'createdAt', 'timestamp', 'Date']) {
        const value = doc.rawFields[field];
        if (value && typeof value === 'string') return value;
    }
    return null;
}

export type { DuplicateCandidate };
