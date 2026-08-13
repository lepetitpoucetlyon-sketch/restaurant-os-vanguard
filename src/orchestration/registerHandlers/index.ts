import { logger } from '@/lib/logger';
import { registerLogisticsHandlers } from './logistics';
import { registerFinanceHandlers } from './finance';
import { registerComplianceHandlers } from './compliance';
import { registerOpsHandlers } from './ops';
import { registerHumanHandlers } from './human';
import { registerCommerceHandlers } from './commerce';
import { registerIntelligenceHandlers } from './intelligence';
import { registerCrmHandlers } from './crm';
import { registerMccHandlers } from './mcc';
import { registerNotificationHandlers } from './notifications';
import { registerTechAuditLedgerHandler } from '../handlers/TechAuditLedgerHandler';
import { initVerticalEventBridge } from '../VerticalEventBridge';
import { registerFleetSystemAlertHandler } from '../handlers/FleetSystemAlertHandler';
import { registerProactiveInsightHandler } from '../handlers/ProactiveInsightHandler';
import { registerBenchmarkPushHandler } from '../handlers/BenchmarkPushHandler';

let clientInitialized = false;
let serverInitialized = false;
const unsubs: Array<() => void> = [];

/**
 * Enregistre tous les handlers métier sur NexusEventBus.
 * Idempotent — safe à appeler plusieurs fois.
 * Appelé une seule fois dans NexusSyncService.init().
 */
export function registerNexusHandlers(): void {
  if (typeof window === 'undefined') {
    logger.warn(
      '[registerNexusHandlers] Appelé en contexte serveur (SSR/API route). ' +
      'Les handlers NexusEventBus ne recevront pas les événements émis par les API routes. ' +
      'Pour un traitement SSR, utilisez dispatchServerEvent().'
    );
  }
  if (clientInitialized) return;
  clientInitialized = true;

  initVerticalEventBridge();

  unsubs.push(
    ...registerLogisticsHandlers(),
    ...registerFinanceHandlers(),
    ...registerComplianceHandlers(),
    ...registerOpsHandlers(),
    ...registerHumanHandlers(),
    ...registerCommerceHandlers(),
    ...registerIntelligenceHandlers(),
    ...registerCrmHandlers(),
    ...registerMccHandlers(),
    ...registerNotificationHandlers(),
    registerTechAuditLedgerHandler(),
    // §7 IA proactive — seuils opérationnels → insights
    ...registerProactiveInsightHandler(),
    // §8 Fleet alertes système uniquement (NF525, crypto, compliance, taux d'erreur)
    ...registerFleetSystemAlertHandler(),
    // §17 Benchmark inter-tenants anonymisé
    registerBenchmarkPushHandler(),
  );
}

export function registerServerNexusHandlers(): void {
  if (serverInitialized) return;
  serverInitialized = true;

  initVerticalEventBridge();

  unsubs.push(
    ...registerLogisticsHandlers(),
    ...registerFinanceHandlers(),
    ...registerComplianceHandlers(),
    ...registerOpsHandlers(),
    ...registerHumanHandlers(),
    ...registerCommerceHandlers(),
    ...registerIntelligenceHandlers(),
    ...registerCrmHandlers(),
    ...registerMccHandlers(),
    ...registerNotificationHandlers(),
    registerTechAuditLedgerHandler(),
    ...registerProactiveInsightHandler(),
    ...registerFleetSystemAlertHandler(),
    registerBenchmarkPushHandler(),
  );
}

export function unregisterNexusHandlers(): void {
  unsubs.forEach(fn => fn());
  unsubs.length = 0;
  clientInitialized = false;
  serverInitialized = false;
}
