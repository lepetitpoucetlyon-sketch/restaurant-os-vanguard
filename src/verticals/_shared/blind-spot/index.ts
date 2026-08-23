/**
 * Barrel du module `blind-spot` : détecteur d'angles morts + registre de règles.
 * Consommé par le ProvisioningWizard (P2a), l'action MCC forge (P3), et les
 * audits ponctuels (rejouables sur tenants existants).
 */

export * from './BlindSpotDetector';
export { DEFAULT_RULES } from './rules';
