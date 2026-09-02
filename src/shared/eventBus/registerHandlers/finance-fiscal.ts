import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

import { registerAutoTipDistributionHandler } from "../handlers/AutoTipDistributionHandler";

export function registerFinanceFiscalHandlers(): Array<() => void> {
  return [
    registerAutoTipDistributionHandler(),
    NexusEventBus.on("finance.ticket_z_closed", async (payload) => {
      try {
        const { TicketZEnforcementService } = await import("@/modules/finance/fiscalite/TicketZEnforcementService");
        const dateIso = (payload as Record<string, unknown>).date as string || (payload as Record<string, unknown>).dateIso as string || new Date().toISOString().split('T')[0];
        await TicketZEnforcementService.recordZClosed(payload.tenantId, dateIso);
      } catch (err) {
        logger.error("[finance.ticket_z_closed] TicketZ record error:", err);
      }
    }),
    NexusEventBus.on("finance.grand_total_sealed", async (payload) => {
      try {
        const { WormArchiveStorageService } = await import("@/modules/finance/fiscalite/WormArchiveStorageService");
        await WormArchiveStorageService.recordGrandTotalSeal(payload);
      } catch (err) {
        logger.error("[finance.grand_total_sealed] Worm archive error:", err);
      }
    })
  ];
}
