import { SiteTelemetry, EmpireInstance, EmpireGlobalMetrics } from '@nexus/contracts';
import { SovereignValue } from '@/shared/nexus-contract';

/**
 * 🧮 fleetMappers — fonctions pures extraites de NexusFleetProvider.
 *
 * But : sortir du composant React la logique riche en branches (~40 fallbacks `||`,
 * IIFE, boucles) qui faisait grimper la complexité cyclomatique du Provider à 60.
 * Chaque helper porte désormais sa propre complexité, bien plus faible.
 */

/** Normalise le `lastSeen` (string | number | Firestore Timestamp) en ISO string. */
export function resolveLastSeen(ls: SiteTelemetry['lastSeen']): string {
  if (typeof ls === 'string') return ls;
  if (typeof ls === 'number') return new Date(ls).toISOString();
  const seconds = (ls as { seconds?: number })?.seconds;
  if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString();
  return new Date().toISOString();
}

/** Reporte un usage de valeur de repli (télémétrie) sans bloquer le mapping. */
function reportFallback(field: string): void {
  import('@/lib/nexus/TelemetryService').then(({ TelemetryService }) =>
    TelemetryService.reportIssue('FALLBACK_VALUE', 'FleetEngine', { field })
  );
}

/** Métriques d'une instance (sous-constructeur de `mapSiteTelemetryToInstance`). */
function buildInstanceMetrics(f: SiteTelemetry): EmpireInstance['metrics'] {
  if (!f.healthScore) reportFallback('healthScore');
  return {
    activeUsers: Number(f.activeUsers) || 0,
    dailyRevenue: Number(f.dailyRevenue) || 0,
    revenue24h: Number(f.dailyRevenue) || 0,
    aiUsageCost: 0,
    healthScore: Number(f.healthScore) || 100,
    complianceScore: Number(f.complianceScore) || 100,
    lowStockAlerts: Number(f.lowStockAlerts) || 0,
    expiringItemsCount: 0,
    alerts: 0,
    errorRate: 0,
    uptime: 99.9
  };
}

/** Branding d'une instance (sous-constructeur). */
function buildInstanceBranding(f: SiteTelemetry): EmpireInstance['branding'] {
  const b = f.branding;
  return {
    primaryColor: (b?.primaryColor as string) || '#6366f1',
    secondaryColor: (b?.secondaryColor as string) || '#a5b4fc',
    logoUrl: (b?.logoUrl as string) || '',
    tagline: (b?.tagline as string) || ''
  };
}

/** Sécurité d'une instance (sous-constructeur). */
function buildInstanceSecurity(f: SiteTelemetry): EmpireInstance['security'] {
  const s = f.security;
  return {
    twoFactorEnabled: Boolean(s?.twoFactorEnabled) || true,
    nf525Certified: Boolean(s?.nf525Certified) || true,
    maintenanceAccessGranted: Boolean(s?.maintenanceAccessGranted) || false,
    supportAccessGranted: Boolean(s?.supportAccessGranted) || false
  };
}

/** Convertit une télémétrie de site brute en `EmpireInstance` normalisée (Grade X). */
export function mapSiteTelemetryToInstance(f: SiteTelemetry): EmpireInstance {
  return {
    id: f.id || f.key || `node-${Math.random().toString(36).substring(7)}`,
    key: f.key || f.id || `key-${Math.random().toString(36).substring(7)}`,
    name: f.name || `Nexus Node ${(f.id || '').slice(0, 4) || '??'}`,
    status: f.status || 'ONLINE',
    tier: f.tier || 'STANDARD',
    version: f.engineVersion || '1.0.0',
    createdAt: f.createdAt || new Date().toISOString(),
    updatedAt: f.updatedAt || new Date().toISOString(),
    lastHeartbeat: resolveLastSeen(f.lastSeen),
    metrics: buildInstanceMetrics(f),
    branding: buildInstanceBranding(f),
    featureFlags: Object.entries(f.featureFlags || {}).reduce((acc, [key, val]) => ({
      ...acc,
      [key]: Boolean(val)
    }), {} as Record<string, boolean>),
    security: buildInstanceSecurity(f)
  };
}

/** Agrège les métriques globales de la flotte à partir des instances + intelligence. */
export function buildGlobalMetrics(
  instances: EmpireInstance[],
  metrics: {
    totalRevenue?: unknown;
    activeUsers?: unknown;
    averageHealth?: unknown;
    totalLaborCost?: unknown;
    averageFoodCost?: unknown;
  }
): EmpireGlobalMetrics {
  return {
    totalInstances: instances.length,
    activeFleetCount: instances.filter(m => m.status === 'ONLINE').length,
    fleetTotalRevenue: Number(metrics.totalRevenue) || 0,
    totalActiveUsers: Number(metrics.activeUsers) || 0,
    averageHealthScore: Number(metrics.averageHealth) || 0,
    averageComplianceScore: 100,
    criticalAlerts: instances.filter(m => m.status === 'CRITICAL').length,
    totalRisks: 0,
    totalMRR: 0,
    averageDiscount: 0,
    lockedInstances: 0,
    totalLaborCost: Number(metrics.totalLaborCost) || 0,
    averageFoodCost: Number(metrics.averageFoodCost) || 0
  };
}

/** Construit le patch de configuration souveraine à diffuser (broadcast). */
export function buildConfigPatch(config: {
  priceMultiplier?: number;
  targetVersion?: string;
  maintenanceMode?: boolean;
  licenceStatus?: 'ACTIVE' | 'LOCKED';
}): Record<string, SovereignValue> {
  const patch: Record<string, SovereignValue> = {};
  if (config.priceMultiplier !== undefined) patch['status.priceMultiplier'] = config.priceMultiplier;
  if (config.targetVersion !== undefined) patch['status.targetVersion'] = config.targetVersion;
  if (config.maintenanceMode !== undefined) patch['status.maintenance'] = config.maintenanceMode;
  if (config.licenceStatus !== undefined) patch['status.licenceStatus'] = config.licenceStatus;
  return patch;
}
