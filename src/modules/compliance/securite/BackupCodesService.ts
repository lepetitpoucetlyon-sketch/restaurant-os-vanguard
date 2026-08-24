/**
 * 🔑 BackupCodesService — Codes de secours 2FA (Plan v3.1 §P0.4).
 *
 * Génère 10 codes à usage unique (format XXXX-XXXX 8 chars alphanumériques
 * uppercase, ambiguïté-safe : pas de 0/O/1/I/L). Stockage des HASH uniquement
 * (bcrypt), jamais des codes en clair. Un code consommé est marqué et ne peut
 * plus être réutilisé.
 *
 * Cas d'usage : un utilisateur a perdu son téléphone (TOTP inutilisable) ou son
 * hardware key (WebAuthn HS) — il peut utiliser un backup code pour se
 * reconnecter, puis re-enrôler un facteur principal.
 *
 * Sécurité :
 *  - Codes ne sont retournés en clair QU'UNE FOIS (au moment de la génération).
 *  - L'utilisateur doit les imprimer / sauvegarder immédiatement.
 *  - Régénération = invalidation de tous les codes précédents.
 */

import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { AuditLogger } from '@/modules/compliance';
import { logger } from '@/lib/logger';

// ── Constants ──────────────────────────────────────────────────────────────────

const BACKUP_CODES_COUNT = 10;
const BACKUP_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // pas de 0/O/1/I/L
const BACKUP_CODE_BLOCK_LEN = 4;
/** Nombre d'itérations PBKDF2 (150k = compromis sécurité/latence). */
const PBKDF2_ITERATIONS = 150_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

// ── Hachage (Web Crypto API — zéro-dep) ────────────────────────────────────────

async function hashCode(plain: string, saltB64: string): Promise<string> {
    const enc = new TextEncoder();
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(plain), 'PBKDF2', false, ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
        keyMaterial,
        HASH_BYTES * 8,
    );
    return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

function generateSalt(): string {
    const salt = new Uint8Array(SALT_BYTES);
    crypto.getRandomValues(salt);
    return btoa(String.fromCharCode(...salt));
}

/** Comparaison en temps constant pour éviter les timing attacks. */
function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return result === 0;
}

// ── Schéma persistance (hash + sel uniquement) ─────────────────────────────────

export const BackupCodeEntrySchema = z.object({
    /** Hash PBKDF2-SHA256 du code — jamais le code en clair. */
    hash: z.string(),
    /** Sel unique par code (base64). */
    salt: z.string(),
    consumedAt: z.number().int().nullable().default(null),
    consumedByIp: z.string().nullable().default(null),
});

export const BackupCodesRecordSchema = z.object({
    userId: z.string(),
    tenantId: z.string(),
    codes: z.array(BackupCodeEntrySchema).length(BACKUP_CODES_COUNT),
    generatedAt: z.number().int(),
    generatedBy: z.string(),
});

export type BackupCodesRecord = z.infer<typeof BackupCodesRecordSchema>;

// ── Génération codes ───────────────────────────────────────────────────────────

/** Génère 1 code au format XXXX-XXXX (8 chars alpha-num safe, séparés par tiret). */
function generateOneCode(): string {
    const rand = new Uint8Array(2 * BACKUP_CODE_BLOCK_LEN);
    crypto.getRandomValues(rand);
    const chars: string[] = [];
    for (const byte of rand) {
        chars.push(BACKUP_CODE_CHARS[byte % BACKUP_CODE_CHARS.length]);
    }
    return `${chars.slice(0, BACKUP_CODE_BLOCK_LEN).join('')}-${chars.slice(BACKUP_CODE_BLOCK_LEN).join('')}`;
}

// ── Persistance ─────────────────────────────────────────────────────────────────

function backupCodesPath(tenantId: string, userId: string): string {
    return `tenants/${tenantId}/mfa_backup_codes/${userId}`;
}

// ── API publique ───────────────────────────────────────────────────────────────

export interface GenerateBackupCodesResult {
    /** Codes en CLAIR — à afficher UNE SEULE FOIS à l'utilisateur, jamais re-lus. */
    readonly plaintextCodes: readonly string[];
    /** Timestamp de génération. */
    readonly generatedAt: number;
}

/**
 * Génère 10 nouveaux backup codes pour un utilisateur.
 * Invalide TOUS les codes précédents (rotation totale).
 * Retourne les codes en CLAIR (à afficher immédiatement) + persiste les HASH.
 */
export async function generateBackupCodes(
    tenantId: string,
    userId: string,
    generatedBy: string,
): Promise<GenerateBackupCodesResult> {
    const plaintextCodes: string[] = [];
    const seen = new Set<string>();
    while (plaintextCodes.length < BACKUP_CODES_COUNT) {
        const code = generateOneCode();
        if (seen.has(code)) continue;
        seen.add(code);
        plaintextCodes.push(code);
    }

    const codes = await Promise.all(
        plaintextCodes.map(async (plain) => {
            const salt = generateSalt();
            const hash = await hashCode(plain, salt);
            return { hash, salt, consumedAt: null, consumedByIp: null };
        }),
    );

    const record: BackupCodesRecord = BackupCodesRecordSchema.parse({
        userId,
        tenantId,
        codes,
        generatedAt: Date.now(),
        generatedBy,
    });

    await Nexus.adapter.set(backupCodesPath(tenantId, userId), record);
    logger.info(`[BackupCodesService] 10 codes générés pour ${userId}@${tenantId} par ${generatedBy}`);

    try {
        await AuditLogger.logAction(
            generatedBy,
            'SECURITY_MFA_BACKUP_CODES_GENERATED' as never,
            userId,
            { count: BACKUP_CODES_COUNT, tenantId },
        );
    } catch (err) {
        logger.warn(`[BackupCodesService] AuditLogger échoué (non-bloquant)`, err);
    }

    return {
        plaintextCodes,
        generatedAt: record.generatedAt,
    };
}

/**
 * Vérifie un code fourni par l'utilisateur.
 * Si valide ET non consommé : le marque comme consommé + retourne true.
 * Sinon : retourne false. **Un code = usage unique**.
 */
export async function verifyAndConsume(
    tenantId: string,
    userId: string,
    submittedCode: string,
    ipAddress: string | null,
): Promise<{ valid: boolean; remainingCount: number }> {
    const record = await Nexus.adapter.get<BackupCodesRecord>(backupCodesPath(tenantId, userId));
    if (!record) return { valid: false, remainingCount: 0 };

    const parsed = BackupCodesRecordSchema.safeParse(record);
    if (!parsed.success) return { valid: false, remainingCount: 0 };

    const normalized = submittedCode.trim().toUpperCase();

    for (let i = 0; i < parsed.data.codes.length; i++) {
        const entry = parsed.data.codes[i];
        if (entry.consumedAt !== null) continue;
        const candidateHash = await hashCode(normalized, entry.salt);
        if (constantTimeEqual(candidateHash, entry.hash)) {
            const updated: BackupCodesRecord = {
                ...parsed.data,
                codes: parsed.data.codes.map((c, idx) =>
                    idx === i ? { ...c, consumedAt: Date.now(), consumedByIp: ipAddress } : c,
                ),
            };
            await Nexus.adapter.set(backupCodesPath(tenantId, userId), updated);

            const remaining = updated.codes.filter(c => c.consumedAt === null).length;
            logger.info(`[BackupCodesService] Code consommé pour ${userId}@${tenantId} — ${remaining} restants`);

            try {
                await AuditLogger.logAction(
                    userId,
                    'SECURITY_MFA_BACKUP_CODE_CONSUMED' as never,
                    userId,
                    { remaining, tenantId },
                    ipAddress ?? '0.0.0.0',
                );
            } catch { /* non-bloquant */ }

            return { valid: true, remainingCount: remaining };
        }
    }

    return { valid: false, remainingCount: parsed.data.codes.filter(c => c.consumedAt === null).length };
}

/** Combien de backup codes restent utilisables. */
export async function remainingBackupCodes(tenantId: string, userId: string): Promise<number> {
    const record = await Nexus.adapter.get<BackupCodesRecord>(backupCodesPath(tenantId, userId));
    if (!record) return 0;
    const parsed = BackupCodesRecordSchema.safeParse(record);
    if (!parsed.success) return 0;
    return parsed.data.codes.filter(c => c.consumedAt === null).length;
}

// ── Barrel-friendly export ─────────────────────────────────────────────────────

export const BackupCodesService = {
    generate: generateBackupCodes,
    verifyAndConsume,
    remaining: remainingBackupCodes,
    BACKUP_CODES_COUNT,
} as const;
