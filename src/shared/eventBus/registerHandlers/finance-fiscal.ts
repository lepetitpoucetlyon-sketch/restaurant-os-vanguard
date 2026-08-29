import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerFinanceFiscalHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("finance.ticket_z_closed", async (payload) => {
      try {
        const { TicketZEnforcementService } = await import("@/modules/finance/fiscalite/TicketZEnforcementService");
        if (typeof (TicketZEnforcementService as any).enforce === "function") {
          await (TicketZEnforcementService as any).enforce(payload);
        }
      } catch (err) {
        logger.error("[finance.ticket_z_closed] TicketZ enforcement error:", err);
      }
    }),
    NexusEventBus.on("finance.grand_total_sealed", async (payload) => {
      try {
        const { WormArchiveStorageService } = await import("@/modules/finance/fiscalite/WormArchiveStorageService");
        if (typeof (WormArchiveStorageService as any).archive === "function") {
          await (WormArchiveStorageService as any).archive(payload);
        }
      } catch (err) {
        logger.error("[finance.grand_total_sealed] Worm archive error:", err);
      }
    })
  ];
}
