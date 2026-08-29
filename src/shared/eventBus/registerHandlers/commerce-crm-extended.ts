import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerCommerceCrmExtendedHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("crm.birthday_approaching", async (payload) => {
      try {
        const { VipGuestPreferenceMemoryService } = await import("@/modules/commerce/relation/crm/services/VipGuestPreferenceMemoryService");
        if (typeof (VipGuestPreferenceMemoryService as any).initGuest === "function") {
          await (VipGuestPreferenceMemoryService as any).initGuest(payload);
        }
      } catch (err) {
        logger.error("[crm.birthday_approaching] Vip preference error:", err);
      }
    })
  ];
}
