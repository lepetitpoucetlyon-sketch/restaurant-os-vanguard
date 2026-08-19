import { registerComplianceHaccpHandlers } from './compliance-haccp';
import { registerComplianceAuditHandlers } from './compliance-audit';

export function registerComplianceHandlers(): Array<() => void> {
  return [
    ...registerComplianceHaccpHandlers(),
    ...registerComplianceAuditHandlers(),
  ];
}
