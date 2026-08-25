/**
 * Barrel des templates de génération L2/L3 (§C.5 du MEGA-PLAN Forge Stack).
 *
 * Chaque template est une fonction pure `(input) => GeneratedFile[]` — testable,
 * déterministe, `skipIfExists: true` par défaut pour ne pas écraser du code
 * métier édité à la main. Consommés par `generateVertical` selon le tier.
 */

export * from './kpiDashboard';
export * from './workflowService';
export * from './regulationGuard';
export * from './hardwareProvisioning';
export * from './verticalTest';
export * from './verticalHeader';
