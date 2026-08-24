/**
 * 🏷️ HtmlSignalExtractor — Extraction déterministe de signaux HTML / JSON-LD / Meta.
 */

import { toError } from '@/lib/toError';
import { toMicrounits } from '@/shared/schemas/primitives';
import type { ExtractedProductItem } from '../../schemas/companyProfile';

/**
 * Extrait tous les blocs `<script type="application/ld+json">…</script>` d'un HTML.
 * Parse strict : ignore silencieusement les blocs invalides (warnings émis).
 */
export function parseJsonLdBlocks(html: string): { blocks: unknown[]; warnings: string[] } {
    const blocks: unknown[] = [];
    const warnings: string[] = [];
    const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    for (const match of html.matchAll(re)) {
        const raw = (match[1] ?? '').trim();
        if (!raw) continue;
        try {
            const parsed = JSON.parse(raw);
            blocks.push(parsed);
        } catch (err) {
            warnings.push(`JSON-LD invalide ignoré: ${toError(err).message}`);
        }
    }
    return { blocks, warnings };
}

/**
 * Extrait les meta tags utiles (OG, Twitter, description, theme-color, title, favicon).
 * Parsing regex sans DOM parser (100% déterministe et sandboxé).
 */
export function parseMetaTags(html: string): Record<string, string> {
    const meta: Record<string, string> = {};

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) meta['title'] = decodeEntities(titleMatch[1].trim());

    const metaRe = /<meta\s+([^>]+?)\/?>/gi;
    for (const m of html.matchAll(metaRe)) {
        const attrs = m[1];
        const name = pickAttr(attrs, 'name') || pickAttr(attrs, 'property') || pickAttr(attrs, 'itemprop');
        const content = pickAttr(attrs, 'content');
        if (name && content) meta[name.toLowerCase()] = decodeEntities(content);
    }

    for (const m of html.matchAll(/<link\s+([^>]+?)\/?>/gi)) {
        const attrs = m[1];
        const rel = pickAttr(attrs, 'rel') ?? '';
        const href = pickAttr(attrs, 'href');
        if (!href) continue;
        if (/\b(icon|shortcut icon|apple-touch-icon)\b/i.test(rel) && !meta['__favicon']) {
            meta['__favicon'] = href;
        }
    }

    return meta;
}

function pickAttr(attrs: string, name: string): string | undefined {
    const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
    const m = attrs.match(re);
    if (!m) return undefined;
    return m[1] ?? m[2] ?? m[3];
}

function decodeEntities(s: string): string {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

export function flattenJsonLd(root: unknown): unknown[] {
    if (Array.isArray(root)) return root.flatMap(flattenJsonLd);
    if (root && typeof root === 'object') {
        const obj = root as Record<string, unknown>;
        if (Array.isArray(obj['@graph'])) return (obj['@graph'] as unknown[]).flatMap(flattenJsonLd);
        return [obj];
    }
    return [];
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return undefined;
}

/** Extrait les items catalogue depuis des blocs JSON-LD (Product / Offer / MenuItem). */
export function extractProductsFromJsonLd(rawBlocks: unknown[], sourceUrl: string): ExtractedProductItem[] {
    const items: ExtractedProductItem[] = [];
    let counter = 0;
    for (const flat of rawBlocks.flatMap(flattenJsonLd)) {
        const node = flat as Record<string, unknown>;
        const type = String(node['@type'] ?? '').toLowerCase();
        if (!['product', 'menuitem', 'offer'].includes(type)) continue;

        const name = pickString(node, 'name', 'title');
        if (!name) continue;

        const description = pickString(node, 'description') ?? '';
        const category = pickString(node, 'category', 'menuAddOn') ?? 'Divers';

        const offerRaw = (node['offers'] ?? node) as Record<string, unknown>;
        const priceStr = pickString(offerRaw, 'price', 'lowPrice');
        if (!priceStr) continue;
        const priceEuros = Number(priceStr.replace(',', '.').replace(/[^\d.-]/g, ''));
        if (!Number.isFinite(priceEuros) || priceEuros < 0) continue;

        counter += 1;
        items.push({
            id: `scraped_${counter}_${slugify(name)}`,
            name,
            description,
            priceInMicrounits: toMicrounits(Math.round(priceEuros * 1_000_000)),
            taxRate: inferTaxRateFromCategory(category, name),
            category,
            isAvailable: true,
            sourceUrl,
        });
    }
    return items;
}

function slugify(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 32) || 'item';
}

function inferTaxRateFromCategory(category: string, name: string): number {
    const corpus = (category + ' ' + name).toLowerCase();
    if (/vin|biere|alcool|cocktail|whisky|spiritueux/.test(corpus)) return 0.20;
    if (/plante|fleur|bouquet|semence|graine/.test(corpus)) return 0.055;
    if (/pain|patisserie|boulang|dessert|plat|entree|menu|salade|sandwich/.test(corpus)) return 0.10;
    if (/service|consultation|abonnement|forfait|pass|seance/.test(corpus)) return 0.20;
    return 0.10;
}

/** Détecte le nom d'entreprise depuis JSON-LD (LocalBusiness/Organization) puis OG puis <title>. */
export function extractName(blocks: unknown[], meta: Record<string, string>, fallback?: string): string {
    for (const flat of blocks.flatMap(flattenJsonLd)) {
        const node = flat as Record<string, unknown>;
        const type = String(node['@type'] ?? '').toLowerCase();
        if (['localbusiness', 'restaurant', 'organization', 'store', 'foodestablishment'].includes(type)) {
            const name = pickString(node, 'name', 'legalName');
            if (name) return name;
        }
    }
    const ogName = meta['og:site_name'] ?? meta['og:title'];
    if (ogName) return ogName.split(/[|·—-]/)[0].trim();
    const title = meta['title'];
    if (title) return title.split(/[|·—-]/)[0].trim();
    return fallback ?? 'Établissement';
}

/** Extrait la couleur de marque : theme-color meta > default. */
export function extractPrimaryColor(meta: Record<string, string>): string {
    const themeColor = meta['theme-color'];
    if (themeColor && /^#[0-9a-fA-F]{6}$/.test(themeColor)) return themeColor;
    if (themeColor && /^#[0-9a-fA-F]{3}$/.test(themeColor)) {
        const [, a, b, c] = themeColor.match(/^#(\w)(\w)(\w)$/)!;
        return `#${a}${a}${b}${b}${c}${c}`;
    }
    return '#C5A059';
}

/** Résout une URL potentiellement relative en absolue. */
export function absolutize(href: string, base: string): string | undefined {
    try {
        return new URL(href, base).toString();
    } catch {
        return undefined;
    }
}
