/**
 * POST /api/oracle/index
 * Indexe un document dans le Sovereign RAG du tenant.
 * Appelé après la création/mise à jour d'une fiche produit, recette ou
 * autre donnée métier pertinente pour le chatbot.
 *
 * Protégé : tenant admin/manager minimum (chef_cuisinier, manager, directeur…).
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { sovereignIngest } from '@/modules/intelligence/rag';
import { logger } from '@/lib/logger';

interface IndexRequest {
    /** Catégorie du document (recette, produit, fournisseur…). */
    type: string;
    /** Données à indexer — converties en texte côté serveur. */
    data: Record<string, unknown>;
}

function documentToText(type: string, doc: Record<string, unknown>): string {
    const id = String(doc.id ?? doc.name ?? 'unknown');
    const name = String(doc.name ?? doc.label ?? doc.description ?? id);
    const parts = [`[${type.toUpperCase()}] ${name}`];

    const textFields = ['description', 'category', 'type', 'status', 'notes', 'instructions'];
    for (const field of textFields) {
        if (typeof doc[field] === 'string' && doc[field]) parts.push(`${field}: ${doc[field]}`);
    }

    // Prix (microunits → euros pour contexte LLM lisible)
    if (typeof doc.priceInMicrounits === 'number') {
        parts.push(`Prix de vente : ${(doc.priceInMicrounits / 1_000_000).toFixed(2)} €`);
    } else if (typeof doc.priceInCents === 'number') {
        parts.push(`Prix de vente : ${(doc.priceInCents / 100).toFixed(2)} €`);
    }

    // Allergènes
    if (Array.isArray(doc.allergens) && (doc.allergens as string[]).length > 0) {
        parts.push(`Allergènes : ${(doc.allergens as string[]).join(', ')}`);
    }

    // Ingrédients (recettes)
    if (Array.isArray(doc.ingredients)) {
        const ings = (doc.ingredients as Array<Record<string, unknown>>)
            .map(i => `${i.name ?? i.ingredientId} (${i.quantity ?? ''} ${i.unit ?? ''})`.trim())
            .join(', ');
        if (ings) parts.push(`Ingrédients : ${ings}`);
    }

    // Drapeaux diététiques
    const flags: string[] = [];
    if (doc.isVegetarian) flags.push('végétarien');
    if (doc.isVegan) flags.push('vegan');
    if (doc.isGlutenFree) flags.push('sans gluten');
    if (flags.length) parts.push(`Régime : ${flags.join(', ')}`);

    return parts.join('\n');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    let body: IndexRequest;
    try {
        body = await req.json() as IndexRequest;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { type, data } = body;
    if (!type || !data) {
        return NextResponse.json({ error: 'type and data are required' }, { status: 400 });
    }

    const text = documentToText(type, data);
    const fileName = `${type}_${String(data.id ?? Date.now())}.txt`;

    try {
        const result = await sovereignIngest({
            workspaceId: caller.tenantId,
            fileName,
            fileContent: new Blob([text], { type: 'text/plain' }),
            mimeType: 'text/plain',
        });
        logger.info(`[OracleIndex] Indexed ${type} for tenant ${caller.tenantId}`, { fileName, jobId: result.jobId });
        return NextResponse.json({ success: true, jobId: result.jobId });
    } catch (err) {
        logger.error('[OracleIndex] Ingest failed', err);
        return NextResponse.json({ error: 'Ingest failed' }, { status: 500 });
    }
}
