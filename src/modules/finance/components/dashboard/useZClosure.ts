import { useCallback, useState } from "react";
import { toast } from "sonner";
import { closeTicketZForDay } from "@/shared/eventBus/handlers/TicketZHandler";

interface ZClosureState {
  closingZ: boolean;
  handleClotureZ: () => Promise<void>;
}

/**
 * useZClosure — encapsule la clôture Z fiscale (jour courant) pour le FinanceDashboard.
 * Extrait du god file FinanceDashboard.tsx pour retirer l'import direct du handler.
 */
export function useZClosure(activeTenantId: string | null | undefined): ZClosureState {
  const [closingZ, setClosingZ] = useState(false);

  const handleClotureZ = useCallback(async () => {
    if (!activeTenantId) return;
    setClosingZ(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await closeTicketZForDay(activeTenantId, today);
      toast.success("Clôture Z effectuée avec succès.");
    } catch {
      toast.error("Erreur lors de la clôture Z.");
    } finally {
      setClosingZ(false);
    }
  }, [activeTenantId]);

  return { closingZ, handleClotureZ };
}
