/**
 * 🔐 MfaChannelsService — Panneau MFA multi-canaux (Plan v3.1 §P0.4).
 *
 * Permet au patron (admin tenant) de choisir quelles méthodes 2FA/MFA sont
 * autorisées pour ses utilisateurs :
 *  - SMS / Téléphone (OTP 6 chiffres)
 *  - Email (Code temporaire / Magic Link)
 *  - App Authenticator TOTP (Google/Microsoft/Apple Passwords)
 *  - Passkeys / Biométrie WebAuthn (FaceID/TouchID/YubiKey)
 *  - Backup Codes (10 clés d'urgence, cf. BackupCodesService)
 *
 * Config stockée par tenant dans Nexus : `tenants/{tenantId}/mfa_config/channels`.
 * SovereignGuard protégé (WORM append-only pour les changements — audit trail).
 */

import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { AuditLogger } from '@/modules/compliance';
import { logger } from '@/lib/logger';

// ── Schéma Zod ──────────────────────────────────────────────────────────────────

export const MfaChannelSchema = z.enum(['sms', 'email', 'totp', 'webauthn', 'backup_codes']);
export type MfaChannel = z.infer<typeof MfaChannelSchema>;

export const MfaChannelsConfigSchema = z.object({
    enabledChannels: z.array(MfaChannelSchema).min(1, 'Au moins un canal MFA doit rester actif'),
    /** Rôles qui doivent obligatoirement enrôler MFA (défaut : admin + manager). */
    requiredFor: z.array(z.string()).default(['admin', 'manager']),
    /** Nombre max de tentatives avant blocage temporaire. */
    maxAttempts: z.number().int().min(3).max(10).default(5),
    /** Fenêtre de validité du code OTP en secondes. */
    codeValiditySeconds: z.number().int().min(30).max(600).default(180),
    updatedAt: z.number().int().default(() => Date.now()),
    updatedBy: z.string().optional(),
});
export type MfaChannelsConfig = z.infer<typeof MfaChannelsConfigSchema>;

// ── Configuration par défaut (WebAuthn + TOTP recommandés) ─────────────────────

export const DEFAULT_MFA_CONFIG: MfaChannelsConfig = MfaChannelsConfigSchema.parse({
    enabledChannels: ['webauthn', 'totp'],
    requiredFor: ['admin', 'manager'],
    maxAttempts: 5,
    codeValiditySeconds: 180,
});

// ── Métadonnées descriptives (pour l'UI /settings/security) ────────────────────

export interface MfaChannelMeta {
    readonly key: MfaChannel;
    readonly label: string;
    readonly description: string;
    readonly securityLevel: 'strong' | 'medium' | 'basic';
    readonly costHint?: string;
    readonly emoji: string;
}

export const MFA_CHANNEL_META: Record<MfaChannel, MfaChannelMeta> = {
    webauthn: {
        key: 'webauthn',
        label: 'Passkeys / Biométrie',
        description: 'FaceID, TouchID, Windows Hello, YubiKey — le plus sécurisé, aucun code à taper.',
        securityLevel: 'strong',
        emoji: '🔐',
    },
    totp: {
        key: 'totp',
        label: 'App Authenticator (TOTP)',
        description: 'Google Authenticator, Microsoft Authenticator, Apple Passwords, 1Password.',
        securityLevel: 'strong',
        emoji: '📱',
    },
    sms: {
        key: 'sms',
        label: 'SMS',
        description: 'Code OTP envoyé par SMS. Coût par envoi. Vulnérable au SIM-swap.',
        securityLevel: 'medium',
        costHint: '~0,05€/SMS',
        emoji: '💬',
    },
    email: {
        key: 'email',
        label: 'Email',
        description: 'Code ou magic-link envoyé par email. Sécurité liée à celle de la boîte.',
        securityLevel: 'medium',
        emoji: '✉️',
    },
    backup_codes: {
        key: 'backup_codes',
        label: 'Codes de secours',
        description: '10 codes d\'urgence à imprimer, chacun utilisable une seule fois.',
        securityLevel: 'basic',
        emoji: '🔑',
    },
};

// ── Persistance Nexus ──────────────────────────────────────────────────────────

function configPath(tenantId: string): string {
    return `tenants/${tenantId}/mfa_config/channels`;
}

/**
 * Lit la config MFA du tenant. Renvoie DEFAULT_MFA_CONFIG si aucune config n'existe.
 */
export async function getMfaConfig(tenantId: string): Promise<MfaChannelsConfig> {
    try {
        const raw = await Nexus.adapter.get<unknown>(configPath(tenantId));
        if (!raw) return DEFAULT_MFA_CONFIG;
        return MfaChannelsConfigSchema.parse(raw);
    } catch (err) {
        logger.warn(`[MfaChannelsService] Config invalide pour ${tenantId}, fallback DEFAULT`, err);
        return DEFAULT_MFA_CONFIG;
    }
}

/**
 * Met à jour la config MFA. Émet un event d'audit `SECURITY_MFA_CONFIG_UPDATED`
 * pour traçabilité opposable en cas d'incident sécurité.
 */
export async function updateMfaConfig(
    tenantId: string,
    partial: Partial<Omit<MfaChannelsConfig, 'updatedAt'>>,
    updatedBy: string,
): Promise<MfaChannelsConfig> {
    const current = await getMfaConfig(tenantId);
    const next = MfaChannelsConfigSchema.parse({
        ...current,
        ...partial,
        updatedAt: Date.now(),
        updatedBy,
    });

    await Nexus.adapter.set(configPath(tenantId), next);
    logger.info(`[MfaChannelsService] Config MFA MAJ pour ${tenantId} par ${updatedBy} — channels=${next.enabledChannels.join(',')}`);

    try {
        await AuditLogger.logAction(
            updatedBy,
            'SECURITY_MFA_CONFIG_UPDATED' as never,
            tenantId,
            { enabledChannels: next.enabledChannels, requiredFor: next.requiredFor },
        );
    } catch (err) {
        logger.warn(`[MfaChannelsService] AuditLogger échoué (non-bloquant)`, err);
    }

    return next;
}

/** Vrai si le canal est activé pour ce tenant. */
export async function isChannelEnabled(tenantId: string, channel: MfaChannel): Promise<boolean> {
    const cfg = await getMfaConfig(tenantId);
    return cfg.enabledChannels.includes(channel);
}

/** Vrai si le rôle donné doit obligatoirement enrôler MFA sur ce tenant. */
export async function isMfaRequiredForRole(tenantId: string, role: string): Promise<boolean> {
    const cfg = await getMfaConfig(tenantId);
    return cfg.requiredFor.includes(role);
}

// ── Barrel-friendly export ─────────────────────────────────────────────────────

export const MfaChannelsService = {
    getConfig: getMfaConfig,
    updateConfig: updateMfaConfig,
    isChannelEnabled,
    isMfaRequiredForRole,
    DEFAULT_MFA_CONFIG,
    MFA_CHANNEL_META,
} as const;
