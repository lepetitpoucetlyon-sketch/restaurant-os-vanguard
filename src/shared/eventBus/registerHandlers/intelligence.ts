import { registerIntelligenceAnalyticsHandlers } from "./intelligence-analytics";
import { registerIntelligenceFleetHandlers } from "./intelligence-fleet";
import { registerIntelligenceAnalyticsExtendedHandlers } from "./intelligence-analytics-extended";

export function registerIntelligenceHandlers(): Array<() => void> {
  return [
    ...registerIntelligenceAnalyticsHandlers(),
    ...registerIntelligenceFleetHandlers(),
    ...registerIntelligenceAnalyticsExtendedHandlers(),
  ];
}
