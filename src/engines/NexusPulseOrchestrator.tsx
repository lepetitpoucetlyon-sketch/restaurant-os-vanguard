"use client";

import { useFinanceReflex } from "@/modules/finance/hooks/useFinanceReflex";
// import { useInventoryReflex } from "@/modules/inventory/hooks/useInventoryReflex";

/**
 * 🛰️ NexusPulseOrchestrator
 * Central point where all cross-domain reflexes are initialized.
 * It ensures that modules can react to pulses even when their specific UI is not mounted.
 */
export function NexusPulseOrchestrator() {
    // 🧬 DOMAIN REFLEXES
    useFinanceReflex();
    
    // 📢 On pourrait ajouter ici un logger global de Pulse pour le mode debug
    
    return null;
}
