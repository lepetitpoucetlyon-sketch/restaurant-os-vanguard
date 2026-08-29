/**
 * 🛡️ SafeFetcher — Fetcher HTTP sandboxé avec protection anti-SSRF et anti-bomb.
 */

import { toError } from '@/lib/toError';

export interface FetchResult {
    finalUrl: string;
    status: number;
    body: string;
    contentType: string;
    truncated: boolean;
}

export const FETCH_TIMEOUT_MS = 8_000;
export const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 Mo/page
export const MAX_REDIRECTS = 3;
export const DEFAULT_MAX_PAGES = 4;
export const USER_AGENT = 'RestaurantOS-CoreBot/1.0 (+onboarding scrape; contact: admin@restaurantos-core.local)';
export const PRIORITY_PATHS = ['/', '/menu', '/carte', '/tarifs', '/services', '/about', '/a-propos', '/contact', '/mentions-legales'];

/**
 * Vérifie que le hostname résout vers une adresse PUBLIQUE. Bloque loopback,
 * link-local, RFC 1918 (IPv4 privé) et fc00::/7 (IPv6 ULA).
 * @throws si l'URL est unsafe (protocole, IP littérale privée, résolution privée).
 */
export async function assertUrlIsPublic(rawUrl: string): Promise<URL> {
    let url: URL;
    try {
        const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(rawUrl);
        url = new URL(hasScheme ? rawUrl : `https://${rawUrl}`);
    } catch {
        throw new Error(`URL invalide: ${rawUrl}`);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error(`Protocole interdit: ${url.protocol}`);
    }
    const hostname = url.hostname.replace(/^\[|\]$/g, '');

    if (['localhost', '0.0.0.0', 'broadcasthost'].includes(hostname.toLowerCase())) {
        throw new Error(`Hostname interne interdit: ${hostname}`);
    }

    const ipVersion = checkIsIp(hostname);

    if (ipVersion !== 0) {
        if (isPrivateIp(hostname)) throw new Error(`IP privée interdite: ${hostname}`);
        return url;
    }

    let resolved: { address: string; family: number };
    try {
        const dns = await import('node:dns/promises');
        resolved = await dns.lookup(hostname);
    } catch (err) {
        throw new Error(`Résolution DNS impossible pour ${hostname}: ${toError(err).message}`);
    }
    if (isPrivateIp(resolved.address)) {
        throw new Error(`Hostname ${hostname} résout vers une IP privée (${resolved.address})`);
    }
    return url;
}

/** Helper de détection IP (v4 / v6) sans dépendance Node. */
function checkIsIp(ip: string): 0 | 4 | 6 {
    const ipv4Parts = ip.split('.');
    if (ipv4Parts.length === 4 && ipv4Parts.every(p => /^\d+$/.test(p) && parseInt(p, 10) >= 0 && parseInt(p, 10) <= 255)) {
        return 4;
    }
    if (ip.includes(':')) {
        return 6;
    }
    return 0;
}

/** True si l'IP (v4 ou v6) appartient à un range privé/loopback/link-local. */
function isPrivateIpv4(ip: string): boolean {
    const parts = ip.split('.').map(n => parseInt(n, 10));
    if (parts.some(n => Number.isNaN(n))) return true;
    const [a, b] = parts as [number, number, number, number];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    return false;
}

function isPrivateIpv6(ip: string): boolean {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:')) return true;
    return false;
}

/** True si l'IP (v4 ou v6) appartient à un range privé/loopback/link-local. */
export function isPrivateIp(ip: string): boolean {
    const version = checkIsIp(ip);
    if (version === 4) return isPrivateIpv4(ip);
    if (version === 6) return isPrivateIpv6(ip);
    return false;
}

export async function fetchSandboxed(url: string): Promise<FetchResult> {
    let current = await assertUrlIsPublic(url);
    let hops = 0;
    while (true) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        let response: Response;
        try {
            response = await fetch(current.toString(), {
                method: 'GET',
                redirect: 'manual',
                signal: controller.signal,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'fr,en;q=0.5',
                },
            });
        } finally {
            clearTimeout(timeout);
        }

        if (response.status >= 300 && response.status < 400) {
            if (hops >= MAX_REDIRECTS) {
                throw new Error(`Trop de redirections (${hops}) depuis ${url}`);
            }
            const location = response.headers.get('location');
            if (!location) throw new Error(`Redirection sans header Location depuis ${current}`);
            const next = new URL(location, current);
            current = await assertUrlIsPublic(next.toString());
            hops += 1;
            continue;
        }

        const contentType = response.headers.get('content-type') ?? '';
        const body = await readCappedText(response, MAX_BODY_BYTES);
        return {
            finalUrl: current.toString(),
            status: response.status,
            body: body.text,
            contentType,
            truncated: body.truncated,
        };
    }
}

/** Lit un body texte plafonné à `maxBytes` (protection anti-bomb). */
async function readCappedText(response: Response, maxBytes: number): Promise<{ text: string; truncated: boolean }> {
    if (!response.body) return { text: await response.text(), truncated: false };
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    let truncated = false;
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        total += value.byteLength;
        if (total > maxBytes) {
            truncated = true;
            try { await reader.cancel(); } catch { /* ignore */ }
            break;
        }
        chunks.push(value);
    }
    const buf = Buffer.concat(chunks.map(c => Buffer.from(c)));
    return { text: buf.toString('utf-8'), truncated };
}
