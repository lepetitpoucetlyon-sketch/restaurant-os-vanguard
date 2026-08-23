/**
 * Barrel de la couche de dérivation (§C.10 du MEGA-PLAN Forge Stack).
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
