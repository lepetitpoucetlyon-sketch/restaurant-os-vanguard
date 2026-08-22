/**
 * 🏛️ RESTAURANT OS - Nexus Instance Re-export (Anti-Duplication C2)
 *
 * Re-exporte le singleton officiel NexusManager depuis NexusAdapter.ts
 * pour garantir l'unicité stricte de l'instance Nexus en mémoire.
 */

export { Nexus, NexusManager } from './NexusAdapter';
