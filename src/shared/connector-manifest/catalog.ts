import type { IConnectorManifest } from './types';
import { OPS_CONNECTORS } from './pillars/connectors.ops';
import { COMMERCE_CONNECTORS } from './pillars/connectors.commerce';
import { FINANCE_CONNECTORS } from './pillars/connectors.finance';
import { HUMAN_CONNECTORS } from './pillars/connectors.human';
import { LOGISTICS_CONNECTORS } from './pillars/connectors.logistics';
import { INTELLIGENCE_CONNECTORS } from './pillars/connectors.intelligence';
import { COMPLIANCE_CONNECTORS } from './pillars/connectors.compliance';

export const CONNECTOR_CATALOG: Record<string, IConnectorManifest> = {
  ...OPS_CONNECTORS,
  ...COMMERCE_CONNECTORS,
  ...FINANCE_CONNECTORS,
  ...HUMAN_CONNECTORS,
  ...LOGISTICS_CONNECTORS,
  ...INTELLIGENCE_CONNECTORS,
  ...COMPLIANCE_CONNECTORS,
};
