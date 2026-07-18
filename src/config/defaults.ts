/**
 * RESTAURANT OS - GRADE VI DEFAULT SETTINGS
 *
 * The canonical `defaultSettings` value now lives in the nexus-contracts layer
 * (`@nexus/contracts` → settings.defaults) alongside the `GlobalSettings` type,
 * so the state layer can consume it without a state → config layer inversion.
 * This module remains the config-layer entry point and simply re-exports it,
 * preserving `@/config/defaults` for existing consumers.
 */
export { defaultSettings } from '@nexus/contracts';
