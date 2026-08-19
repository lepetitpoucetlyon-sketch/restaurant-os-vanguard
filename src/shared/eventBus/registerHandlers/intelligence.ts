import { registerIntelligenceFleetHandlers } from './intelligence-fleet';
import { registerIntelligenceAnalyticsHandlers } from './intelligence-analytics';

export function registerIntelligenceHandlers(): Array<() => void> {
  return [
    ...registerIntelligenceFleetHandlers(),
    ...registerIntelligenceAnalyticsHandlers(),
  ];
}
