import { useState, useCallback } from "react";
import { toast } from "sonner";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { empireAudit } from "@/lib/audit";
import { PERMISSION_ROLE_LEVELS, type PermissionRole } from "@/shared/nexus/contracts/permissions.types";

const MIN_ALERT_ROLE_LEVEL = PERMISSION_ROLE_LEVELS['hotesse']; // 30 — tout le personnel de salle

interface CashTransaction {
  id: string;
  type: 'SKIM' | 'DROP' | 'SALE' | 'REFUND';
  amountInMicrounits: number;
  timestamp: number;
  operatorId: string;
}

export function useCashDrawer(
  drawerId: string,
  tenantId: string,
  currentOperatorId: string,
  currentOperatorRole: string = 'plongeur',
  initialFloatMicrounits: number = 150_000_000, // Fond de caisse par défaut 150 €
) {
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    if (type === 'success') toast.success(msg);
    else if (type === 'error') toast.error(msg);
    else if (type === 'warning') toast.warning(msg);
    else toast.info(msg);
  }, []);
  
  const [expectedAmountInMicrounits, setExpectedAmountInMicrounits] = useState(initialFloatMicrounits);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [isCounterOpen, setIsCounterOpen] = useState(false);
  const [counterType, setCounterType] = useState<'EOD_CLOSE' | 'SKIM' | 'DROP'>('EOD_CLOSE');

  const addTransaction = useCallback((type: 'SKIM' | 'DROP' | 'SALE' | 'REFUND', amountInMicrounits: number) => {
    const tx: CashTransaction = {
      id: crypto.randomUUID(),
      type,
      amountInMicrounits,
      timestamp: Date.now(),
      operatorId: currentOperatorId
    };
    
    setTransactions(prev => [...prev, tx]);
    
    if (type === 'SKIM' || type === 'REFUND') {
      setExpectedAmountInMicrounits(prev => prev - amountInMicrounits);
    } else if (type === 'DROP' || type === 'SALE') {
      setExpectedAmountInMicrounits(prev => prev + amountInMicrounits);
    }
  }, [currentOperatorId]);

  const openCounter = useCallback((type: 'EOD_CLOSE' | 'SKIM' | 'DROP') => {
    setCounterType(type);
    setIsCounterOpen(true);
  }, []);

  const closeCounter = useCallback(() => {
    setIsCounterOpen(false);
  }, []);

  const handleValidateCount = useCallback(async (countedAmountInMicrounits: number, discrepancyInMicrounits: number) => {
    try {
      if (counterType === 'SKIM') {
        addTransaction('SKIM', countedAmountInMicrounits);
        showToast(`Prélèvement de ${countedAmountInMicrounits / 1_000_000} € enregistré.`, 'success');
      } else if (counterType === 'DROP') {
        addTransaction('DROP', countedAmountInMicrounits);
        showToast(`Dépôt de ${countedAmountInMicrounits / 1_000_000} € enregistré.`, 'success');
      } else if (counterType === 'EOD_CLOSE') {
        empireAudit.log({
          module: 'finance',
          action: 'CASH_DRAWER_COUNTED',
          details: { drawerId, expectedAmountInMicrounits, countedAmountInMicrounits, discrepancyInMicrounits },
          severity: Math.abs(discrepancyInMicrounits) > 5_000_000 ? 'high' : 'low',
          timestamp: new Date(),
        });
        showToast(`Caisse comptée. Écart : ${discrepancyInMicrounits / 1_000_000} €`, 'success');
      }
    } catch (e) {
      showToast('Erreur lors de la validation du comptage', 'error');
      throw e;
    }
  }, [counterType, addTransaction, showToast, drawerId, expectedAmountInMicrounits]);

  const triggerUnauthorizedOpen = useCallback(async () => {
    const roleLevel = PERMISSION_ROLE_LEVELS[currentOperatorRole as PermissionRole] ?? 0;
    if (roleLevel < MIN_ALERT_ROLE_LEVEL) {
      showToast('Accès refusé — rôle insuffisant pour émettre une alerte caisse', 'error');
      return;
    }
    await NexusEventBus.emitDurable('cash_drawer.opened_unauthorized', {
      v: 1,
      drawerId,
      operatorId: currentOperatorId,
      tenantId,
      detectedAt: Date.now()
    });
    showToast('Alerte de sécurité envoyée', 'error');
  }, [drawerId, currentOperatorId, currentOperatorRole, tenantId, showToast]);

  return {
    expectedAmountInMicrounits,
    transactions,
    isCounterOpen,
    counterType,
    openCounter,
    closeCounter,
    handleValidateCount,
    triggerUnauthorizedOpen
  };
}
