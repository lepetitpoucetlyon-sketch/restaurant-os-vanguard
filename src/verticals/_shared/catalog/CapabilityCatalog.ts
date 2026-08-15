/**
 * 🧬 CapabilityCatalog — Registre universel typé des capabilities métier
 *
 * PROBLÈME RÉSOLU : dans TenantConfigSchema, `capabilities` n'est typé que
 * `z.record(z.string(), z.boolean())` — aucune clé n'est connue à la compilation,
 * chaque DNA re-déclare ses `mod_*` en dur, et rien ne détecte une clé fantôme.
 *
 * Ce fichier est la SOURCE DE VÉRITÉ de la « couche généraliste » : il liste les
 * 45 capabilities réellement câblées dans l'app (extraites de src/ le 2026-08-15),
 * chacune rattachée à son pilier, avec ses dépendances, le matériel qu'elle implique
 * et l'addendum légal éventuel. C'est le magasin d'« options » dans lequel chaque
 * VerticalBlueprint vient piocher.
 *
 * Module FEUILLE : n'importe RIEN de `@/modules` ni `@/verticals` → aucun cycle.
 * Ajouter une capability = ajouter une entrée ici (+ la câbler côté module/nav).
 *
 * Pattern deux-temps : RAW_CATALOG (`as const`) fige les clés littérales → on en
 * dérive `CapabilityKey`, puis la vue typée `CAPABILITY_CATALOG` valide chaque
 * entrée (dont les `dependsOn`, qui doivent être des clés existantes).
 */

/** Les 8 piliers métier + les couches transverses (core, mcc). */
export type VerticalPillar =
    | 'core'
    | 'ops'
    | 'commerce'
    | 'finance'
    | 'compliance'
    | 'human'
    | 'logistics'
    | 'intelligence'
    | 'facility'
    | 'mcc';

/** Familles de périphériques implicitement requises par une capability. */
export type HardwareKind =
    | 'receipt_printer'
    | 'cash_drawer'
    | 'card_terminal'
    | 'kds_screen'
    | 'kitchen_printer'
    | 'label_printer'
    | 'barcode_scanner'
    | 'scale'
    | 'temperature_probe'
    | 'kiosk_terminal'
    | 'rfid_reader'
    | 'turnstile'
    | 'badge_encoder';

/**
 * RAW — les 45 capabilities canoniques. `as const` fige clés + valeurs littérales.
 * L'ordre suit les piliers pour la lisibilité.
 */
const RAW_CATALOG = {
    // ── CORE / transverse ────────────────────────────────────────────────────
    mod_dashboard:            { key: 'mod_dashboard',            label: 'Tableau de bord',            pillar: 'core',         description: 'Cockpit d\'accueil du tenant.' },
    mod_settings:             { key: 'mod_settings',             label: 'Paramètres',                 pillar: 'core',         description: 'Réglages généraux du tenant.' },
    mod_access_management:    { key: 'mod_access_management',     label: 'Gestion des accès (RBAC)',   pillar: 'core',         description: 'Rôles, PIN, permissions utilisateurs.' },
    mod_brand_basic:          { key: 'mod_brand_basic',          label: 'Marque — Basique',           pillar: 'core',         description: 'Branding tenant niveau standard.' },
    mod_brand_plus:           { key: 'mod_brand_plus',           label: 'Marque — Plus',              pillar: 'core',         description: 'Branding avancé (splash, polices, presets).', dependsOn: ['mod_brand_basic'] },
    mod_kiosk:                { key: 'mod_kiosk',                 label: 'Mode Kiosque',               pillar: 'ops',          description: 'Point de vente en libre-service.', dependsOn: ['mod_pos'], requiredHardware: ['kiosk_terminal'] },

    // ── OPS — service / production ─────────────────────────────────────────────
    mod_pos:                  { key: 'mod_pos',                  label: 'Caisse (POS)',               pillar: 'ops',          description: 'Encaissement NF525.', requiredHardware: ['receipt_printer', 'cash_drawer', 'card_terminal'] },
    mod_bar:                  { key: 'mod_bar',                  label: 'Bar',                        pillar: 'ops',          description: 'Service comptoir / bar.', dependsOn: ['mod_pos'], requiredHardware: ['receipt_printer'] },
    mod_kds:                  { key: 'mod_kds',                  label: 'Écran cuisine (KDS)',        pillar: 'ops',          description: 'Affichage des commandes en production.', dependsOn: ['mod_pos'], requiredHardware: ['kds_screen'] },
    mod_kitchen_management:   { key: 'mod_kitchen_management',   label: 'Gestion cuisine',            pillar: 'ops',          description: 'Fiches techniques, préparation, envois.', dependsOn: ['mod_pos'], requiredHardware: ['kitchen_printer'] },
    mod_floor_plan:           { key: 'mod_floor_plan',           label: 'Plan de salle',              pillar: 'facility',     description: 'Tables, zones, réservation d\'espace.' },
    mod_pms:                  { key: 'mod_pms',                  label: 'PMS (hébergement)',          pillar: 'ops',          description: 'Planning chambres / lits, séjours.' },

    // ── COMMERCE — acquisition / relation / fidelite ──────────────────────────
    mod_reservations:         { key: 'mod_reservations',         label: 'Réservations',               pillar: 'commerce',     description: 'Prise de rendez-vous / créneaux.' },
    mod_groups:               { key: 'mod_groups',               label: 'Groupes',                    pillar: 'commerce',     description: 'Réservations de groupe / grandes tablées.', dependsOn: ['mod_reservations'] },
    mod_omnichannel:          { key: 'mod_omnichannel',          label: 'Omnicanal',                  pillar: 'commerce',     description: 'Vente multi-canal (click&collect, delivery).' },
    mod_customer:             { key: 'mod_customer',             label: 'Clients',                    pillar: 'commerce',     description: 'Fiche client / base contacts.' },
    mod_crm:                  { key: 'mod_crm',                  label: 'CRM',                        pillar: 'commerce',     description: 'Segmentation RFM, cycle de vie client.', dependsOn: ['mod_customer'] },
    mod_quotes:               { key: 'mod_quotes',               label: 'Devis',                      pillar: 'commerce',     description: 'Devis et propositions commerciales.', dependsOn: ['mod_customer'] },
    mod_marketing:            { key: 'mod_marketing',            label: 'Marketing',                  pillar: 'commerce',     description: 'Campagnes et promotions.' },
    mod_social_marketing:     { key: 'mod_social_marketing',     label: 'Marketing social',           pillar: 'commerce',     description: 'Publication et pilotage réseaux sociaux.', dependsOn: ['mod_marketing'] },
    mod_seo:                  { key: 'mod_seo',                  label: 'SEO',                        pillar: 'commerce',     description: 'Référencement naturel.' },
    mod_ai_referencing:       { key: 'mod_ai_referencing',       label: 'Référencement IA',           pillar: 'commerce',     description: 'Optimisation de présence via IA.', dependsOn: ['mod_seo'] },
    mod_google_analytics:     { key: 'mod_google_analytics',     label: 'Google Analytics',           pillar: 'commerce',     description: 'Connecteur d\'analytics d\'audience.' },
    mod_onboarding:           { key: 'mod_onboarding',           label: 'Onboarding',                 pillar: 'commerce',     description: 'Migration & mise en route depuis un concurrent.' },

    // ── FINANCE — comptabilite / tresorerie ────────────────────────────────────
    mod_treasury:             { key: 'mod_treasury',             label: 'Trésorerie',                 pillar: 'finance',      description: 'Banque, encaissements, flux.' },
    mod_accounting_management:{ key: 'mod_accounting_management', label: 'Comptabilité',               pillar: 'finance',      description: 'Journal, FEC, facturation.' },

    // ── COMPLIANCE — qualite / securite / reglementaire ───────────────────────
    mod_haccp:                { key: 'mod_haccp',                label: 'HACCP',                      pillar: 'compliance',   description: 'Relevés température, traçabilité, DLC.', requiredHardware: ['temperature_probe'] },
    mod_hygiene:              { key: 'mod_hygiene',              label: 'Hygiène',                    pillar: 'compliance',   description: 'Plans de nettoyage et contrôles d\'hygiène.' },
    mod_quality_control:      { key: 'mod_quality_control',      label: 'Contrôle qualité',           pillar: 'compliance',   description: 'Contrôles et non-conformités.' },
    mod_rgpd:                 { key: 'mod_rgpd',                 label: 'RGPD',                       pillar: 'compliance',   description: 'Consentements, registre, droits.' },

    // ── HUMAN — effectifs / remuneration ──────────────────────────────────────
    mod_hr:                   { key: 'mod_hr',                   label: 'RH',                         pillar: 'human',        description: 'Dossiers salariés, contrats.' },
    mod_planning:             { key: 'mod_planning',             label: 'Planning',                   pillar: 'human',        description: 'Plannings et shifts.', dependsOn: ['mod_hr'] },
    mod_leaves:               { key: 'mod_leaves',               label: 'Congés',                     pillar: 'human',        description: 'Demandes et soldes de congés.', dependsOn: ['mod_hr'] },
    mod_timeclock:            { key: 'mod_timeclock',            label: 'Badgeuse',                   pillar: 'human',        description: 'Pointage entrées/sorties.', dependsOn: ['mod_hr'] },
    mod_recruitment:          { key: 'mod_recruitment',          label: 'Recrutement',                pillar: 'human',        description: 'Suivi des candidatures.', dependsOn: ['mod_hr'] },

    // ── LOGISTICS — stock / approvisionnement ─────────────────────────────────
    mod_inventory:            { key: 'mod_inventory',            label: 'Stocks',                     pillar: 'logistics',    description: 'Inventaire, mouvements, transferts.', requiredHardware: ['barcode_scanner'] },
    mod_storage_map:          { key: 'mod_storage_map',          label: 'Plan de stockage',           pillar: 'logistics',    description: 'Emplacements et zones de stockage.', dependsOn: ['mod_inventory'] },

    // ── INTELLIGENCE — analytique / ia / knowledge ────────────────────────────
    mod_analytics:            { key: 'mod_analytics',            label: 'Analytics',                  pillar: 'intelligence', description: 'Rapports et indicateurs.' },
    mod_executive_intelligence:{ key: 'mod_executive_intelligence', label: 'Intelligence exécutive',  pillar: 'intelligence', description: 'BI de direction, synthèses.', dependsOn: ['mod_analytics'] },
    mod_ai:                   { key: 'mod_ai',                   label: 'IA',                         pillar: 'intelligence', description: 'Assistance IA (Gemini).' },
    mod_oracle:               { key: 'mod_oracle',               label: 'Oracle',                     pillar: 'intelligence', description: 'Chat métier / copilote IA.', dependsOn: ['mod_ai'] },
    mod_agent_dashboard:      { key: 'mod_agent_dashboard',      label: 'Dashboard agents',           pillar: 'intelligence', description: 'Pilotage des agents autonomes.', dependsOn: ['mod_ai'] },
    mod_system_map:           { key: 'mod_system_map',           label: 'Carte système',              pillar: 'intelligence', description: 'Cartographie de l\'architecture tenant.' },
    mod_fleet_management:     { key: 'mod_fleet_management',     label: 'Gestion de flotte',          pillar: 'mcc',          description: 'Supervision multi-établissements (MCC).' },

    // ── FACILITY — maintenance / assets ───────────────────────────────────────
    mod_registre:             { key: 'mod_registre',             label: 'Registre',                   pillar: 'facility',     description: 'Registre de sécurité / maintenance.' },
} as const;

/** Union des 45 clés de capabilities canoniques (dérivée du RAW). */
export type CapabilityKey = keyof typeof RAW_CATALOG;

export interface CapabilityMeta {
    /** Clé canonique (== champ dans le record `capabilities`). */
    readonly key: CapabilityKey;
    /** Libellé FR affichable (MCC, wizard de provisioning). */
    readonly label: string;
    /** Pilier propriétaire de la logique métier. */
    readonly pillar: VerticalPillar;
    /** Rôle en une phrase. */
    readonly description: string;
    /** Capabilities pré-requises (activées transitivement par le résolveur). */
    readonly dependsOn?: readonly CapabilityKey[];
    /** Matériel que cette capability suppose côté point de vente / atelier. */
    readonly requiredHardware?: readonly HardwareKind[];
    /**
     * Indice d'addendum légal (aligné sur LegalContractGenerator.VerticalType)
     * lorsque la capability porte une obligation réglementaire propre.
     */
    readonly requiredLegalAddendum?: string;
}

/**
 * Vue typée du catalogue. L'assignation `Record<CapabilityKey, CapabilityMeta>`
 * valide structurellement chaque entrée — notamment que tout `dependsOn`
 * référence une clé existante.
 */
export const CAPABILITY_CATALOG: Record<CapabilityKey, CapabilityMeta> = RAW_CATALOG;

/** Toutes les clés, sous forme de tableau. */
export const CAPABILITY_KEYS = Object.keys(CAPABILITY_CATALOG) as CapabilityKey[];

/** Record partiel de capabilities activées (ce que porte un TenantConfig). */
export type CapabilitySet = Partial<Record<CapabilityKey, boolean>>;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Métadonnées d'une capability (typé, jamais undefined pour une clé valide). */
export function getCapability(key: CapabilityKey): CapabilityMeta {
    return CAPABILITY_CATALOG[key];
}

/** Toutes les capabilities d'un pilier donné. */
export function capabilitiesByPillar(pillar: VerticalPillar): CapabilityMeta[] {
    return CAPABILITY_KEYS.map(getCapability).filter(c => c.pillar === pillar);
}

/**
 * Étend un ensemble de capabilities avec leurs dépendances transitives.
 * Ex : ['mod_kds'] → ['mod_kds', 'mod_pos'].
 */
export function resolveCapabilityDependencies(keys: readonly CapabilityKey[]): CapabilityKey[] {
    const resolved = new Set<CapabilityKey>();
    const visit = (k: CapabilityKey): void => {
        if (resolved.has(k)) return;
        resolved.add(k);
        for (const dep of getCapability(k).dependsOn ?? []) visit(dep);
    };
    for (const k of keys) visit(k);
    return [...resolved];
}

/** Matériel agrégé (dédupliqué) impliqué par un ensemble de capabilities. */
export function requiredHardwareFor(keys: readonly CapabilityKey[]): HardwareKind[] {
    const hw = new Set<HardwareKind>();
    for (const k of resolveCapabilityDependencies(keys)) {
        for (const h of getCapability(k).requiredHardware ?? []) hw.add(h);
    }
    return [...hw];
}

/** Type guard : la chaîne est-elle une capability connue du catalogue ? */
export function isKnownCapability(key: string): key is CapabilityKey {
    return key in CAPABILITY_CATALOG;
}

/**
 * Détecte les clés fantômes d'un record `capabilities` (typé large en base).
 * Utilisé pour valider un DNA / un override contre le catalogue.
 */
export function findUnknownCapabilities(caps: Record<string, boolean>): string[] {
    return Object.keys(caps).filter(k => !isKnownCapability(k));
}
