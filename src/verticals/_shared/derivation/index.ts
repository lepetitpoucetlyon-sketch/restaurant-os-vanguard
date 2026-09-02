/**
 * Barrel de la couche de dérivation (§C.10 du MEGA-PLAN Forge Stack).
 *
 * @wip owner:Mohammed-ali échéance:2026-12-31
 * GELÉ — décision #2 de docs/plans/PLAN-CORRECTIF-STRUCTURE-2026-09-02.md.
 * Les 13 *Deriver.ts sont écrits mais AUCUN n'est appelé par le flux de
 * provisioning réel (`src/lib/mcc/provisioning/steps/provisioningSteps.ts`).
 * L'onglet MCC `DeriversTab` est une maquette (sampleOutput en dur).
 * → à câbler dans provisioningSteps.ts le jour de l'onboarding d'une verticale
 *   n°3 (≈2-3 j), sinon supprimer les 13 fichiers (~110 Ko).
 * `blind-spot/` (à côté) est, lui, réellement branché (BlindSpotTab).
 *
 * Chaque dériveur est un module feuille pur qui transforme
 * (QualificationAnswers + CompanyProfile + SectorStudy + variant) en une
 * PARTIE du CalibratedTenantConfig. Ils sont commutatifs et rétro-compatibles :
 * chaque nouveau dériveur ajoute une clé sans casser les autres.
 *
 * P2a (livré) : RbacDeriver, BusinessLawsDeriver.
 * P2b (à venir) : Rgpd, Security, Legal.
 * P2c (à venir) : Localization, Integrations, Comms, HardwareSizing.
 * P2d (à venir) : Kpi, Formation, Pricing, Backup.
 */

export * from './RbacDeriver';
export * from './BusinessLawsDeriver';
export * from './RgpdDeriver';
export * from './SecurityDeriver';
export * from './LegalDeriver';
export * from './LocalizationDeriver';
export * from './IntegrationsDeriver';
export * from './CommsDeriver';
export * from './HardwareSizingDeriver';
export * from './KpiDeriver';
export * from './FormationDeriver';
export * from './PricingDeriver';
export * from './BackupDeriver';
