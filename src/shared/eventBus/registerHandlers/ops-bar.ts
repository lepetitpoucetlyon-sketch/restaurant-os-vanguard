import { NexusEventBus } from "../NexusEventBus";

/**
 * Écart de dosage bec verseur (SmartSpoutTelemetryService a détecté un
 * sur-versement ou un free-pour) → notification au manager pour contrôle.
 */
export function registerOpsBarHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("bar.spout_variance_detected", (payload) => {
      const p = payload as {
        tenantId: string;
        spoutId: string;
        productId: string;
        varianceCl: number;
      };
      NexusEventBus.emit("notification.created", {
        v: 1,
        tenantId: p.tenantId,
        id: crypto.randomUUID(),
        type: "alert",
        title: "Écart de dosage bar",
        message: `Bec ${p.spoutId} — ${p.varianceCl > 0 ? "+" : ""}${p.varianceCl} cl vs caisse (produit ${p.productId}). Contrôle recommandé.`,
        priority: "high",
        read: false,
        timestamp: new Date().toISOString(),
      });
    }),
  ];
}
