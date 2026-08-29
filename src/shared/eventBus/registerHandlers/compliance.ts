import { registerComplianceHaccpHandlers } from "./compliance-haccp";
import { registerComplianceAuditHandlers } from "./compliance-audit";
import { registerComplianceSanitaryHandlers } from "./compliance-sanitary";
import { registerComplianceEnvironmentalHandlers } from "./compliance-environmental";
import { registerComplianceSecurityHandlers } from "./compliance-security";

export function registerComplianceHandlers(): Array<() => void> {
  return [
    ...registerComplianceHaccpHandlers(),
    ...registerComplianceAuditHandlers(),
    ...registerComplianceSanitaryHandlers(),
    ...registerComplianceEnvironmentalHandlers(),
    ...registerComplianceSecurityHandlers(),
  ];
}
