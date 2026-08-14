/**
 * MCC OPERATOR CONTRACT — Super Admin Plateforme
 *
 * Ce fichier définit les rôles et niveaux du CONSTRUCTEUR DE LA PLATEFORME
 * (le super admin MCC). Ces rôles sont COMPLÈTEMENT SÉPARÉS du RBAC tenant.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  Le MCC opère via :                                            ║
 * ║    - APP_MODE = 'mcc' (src/config/instance.ts)                 ║
 * ║    - FLEET_OPERATOR identity (src/lib/IdentityManager.ts)      ║
 * ║    - Routes dédiées /app/(admin)/                               ║
 * ║    - SovereignGuard empêche TOUTE lecture de données tenant     ║
 * ║    - NexusBridge telemetry montante uniquement (sans accès PII) ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ⛔ JAMAIS d'import de PermissionRole ici — systèmes totalement disjoints.
 */

// ── Types MCC ─────────────────────────────────────────────────────────────

/**
 * Niveaux d'accès internes à l'équipe MCC.
 * Stockés dans Firestore : `mcc/operators/{uid}`.
 */
export type MccOperatorLevel =
    | 'support'    // 1 — Support client : lecture télémétrie, tickets, logs
    | 'operator'   // 2 — Opérateur flotte : provisioning, clone, décommission
    | 'admin';     // 3 — Admin MCC : changelog, configs globales, feature flags

export const MCC_OPERATOR_LEVELS: Record<MccOperatorLevel, number> = {
    support:  1,
    operator: 2,
    admin:    3,
};

export const MCC_OPERATOR_LABELS: Record<MccOperatorLevel, string> = {
    support:  'Support Client',
    operator: 'Opérateur Flotte',
    admin:    'Admin MCC',
};

// ── Ce que chaque niveau peut faire ───────────────────────────────────────

export const MCC_CAPABILITIES: Record<MccOperatorLevel, string[]> = {
    support: [
        'read:fleet_telemetry',    // Lecture télémétrie anonymisée
        'read:support_tickets',    // Lecture tickets support tenant
        'read:system_health',      // Statut uptime et alertes système
        'read:provisioning_logs',  // Logs de provisioning
    ],
    operator: [
        // Hérite de support
        'read:fleet_telemetry',
        'read:support_tickets',
        'read:system_health',
        'read:provisioning_logs',
        // Opérations flotte
        'write:tenant_provisioning',  // Créer un nouveau tenant
        'write:tenant_clone_ref',     // Cloner depuis un tenant _ref_*
        'write:tenant_decommission',  // Décommissionner un tenant
        'write:tenant_plan',          // Changer le plan SaaS
        'read:tenant_metadata',       // Lire metadata (nom, plan, version) — PAS les données métier
    ],
    admin: [
        // Hérite de operator
        'read:fleet_telemetry',
        'read:support_tickets',
        'read:system_health',
        'read:provisioning_logs',
        'write:tenant_provisioning',
        'write:tenant_clone_ref',
        'write:tenant_decommission',
        'write:tenant_plan',
        'read:tenant_metadata',
        // Administration plateforme
        'write:changelog',            // Publier changelog
        'write:global_feature_flags', // Activer/désactiver features globalement
        'write:ref_tenants',          // Modifier les tenants _ref_* (templates)
        'write:mcc_operators',        // Gérer les autres opérateurs MCC
        'write:billing_config',       // Config facturation plateforme
        'read:aggregated_analytics',  // Analytics agrégées anonymisées (pas par tenant)
    ],
};

// ── Guard utilitaire ──────────────────────────────────────────────────────

/**
 * Vérifie si un opérateur MCC a le niveau requis.
 * À utiliser dans les routes /app/(admin)/ uniquement.
 */
export function mccHasLevel(
    operatorLevel: MccOperatorLevel,
    requiredLevel: MccOperatorLevel
): boolean {
    return MCC_OPERATOR_LEVELS[operatorLevel] >= MCC_OPERATOR_LEVELS[requiredLevel];
}

/**
 * Vérifie si un opérateur MCC a une capability spécifique.
 */
export function mccHasCapability(
    operatorLevel: MccOperatorLevel,
    capability: string
): boolean {
    return MCC_CAPABILITIES[operatorLevel].includes(capability);
}

// ── Firestore path MCC ────────────────────────────────────────────────────

/** Path Firestore d'un opérateur MCC (hors collection tenant). */
export const MCC_OPERATOR_PATH = (uid: string) => `mcc/operators/${uid}` as const;

/** Path Firestore de la config globale MCC. */
export const MCC_CONFIG_PATH = 'mcc/config' as const;

/** Path Firestore du changelog plateforme. */
export const MCC_CHANGELOG_PATH = 'mcc/changelog' as const;
