import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerFinanceFiscalHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("finance.ticket_z_closed", async (payload) => {
      try {
        const { TicketZEnforcementService } = await import("@/modules/finance/fiscalite/TicketZEnforcementService");
        if (typeof (TicketZEnforcementService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).enforce === "function") {
          await (TicketZEnforcementService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).enforce(payload);
        }
      } catch (err) {
        logger.error("[finance.ticket_z_closed] TicketZ enforcement error:", err);
      }
    }),
    NexusEventBus.on("finance.grand_total_sealed", async (payload) => {
      try {
        const { WormArchiveStorageService } = await import("@/modules/finance/fiscalite/WormArchiveStorageService");
        if (typeof (WormArchiveStorageService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).archive === "function") {
          await (WormArchiveStorageService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).archive(payload);
        }
      } catch (err) {
        logger.error("[finance.grand_total_sealed] Worm archive error:", err);
      }
    })
  ];
}
