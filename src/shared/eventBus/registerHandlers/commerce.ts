import { registerCommerceCrmExtendedHandlers } from "./commerce-crm-extended";
import { registerCRMVipHandler } from "@/modules/commerce";

export function registerCommerceHandlers(): Array<() => void> {
  return [
    ...registerCommerceCrmExtendedHandlers(),
    registerCRMVipHandler(),
  ];
}
