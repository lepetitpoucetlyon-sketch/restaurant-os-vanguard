'use client';

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { empireAudit } from "@/lib/audit";
import { PERMISSION_ROLE_LEVELS, type PermissionRole } from "@/shared/nexus/contracts/permissions.types";

const MIN_ALERT_ROLE_LEVEL = PERMISSION_ROLE_LEVELS['hotesse']; // 30

interface CashTransaction {
  id: string;
  type: 'SKIM' | 'DROP' | 'SALE' | 'REFUND';
  amountInMicrounits: number;
  timestamp: number;
  operatorId: string;
}

const DELTA_MAP: Record<'SKIM' | 'DROP' | 'SALE' | 'REFUND', number> = {
  SKIM: -1,
  REFUND: -1,
  DROP: 1,
  SALE: 1,
};

export function useCashDrawer(
  drawerId: string,
  tenantId: string,
  currentOperatorId: string,
  currentOperatorRole: string = 'plongeur',
  initialFloatMicrounits: number = 150_000_000,
) {
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
      operatorId: currentOperatorId,
    };
    
    setTransactions(prev => [...prev, tx]);
    const multiplier = DELTA_MAP[type] ?? 0;
    setExpectedAmountInMicrounits(prev => prev + multiplier * amountInMicrounits);
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
      if (counterType === 'SKIM' || counterType === 'DROP') {
        addTransaction(counterType, countedAmountInMicrounits);
        const label = counterType === 'SKIM' ? 'Prélèvement' : 'Dépôt';
        toast.success(`${label} de ${countedAmountInMicrounits / 1_000_000} € enregistré.`);
        return;
      }

      empireAudit.log({
        module: 'finance',
        action: 'CASH_DRAWER_COUNTED',
        details: { drawerId, expectedAmountInMicrounits, countedAmountInMicrounits, discrepancyInMicrounits },
        severity: Math.abs(discrepancyInMicrounits) > 5_000_000 ? 'high' : 'low',
        timestamp: new Date(),
      });
      toast.success(`Caisse comptée. Écart : ${discrepancyInMicrounits / 1_000_000} €`);
    } catch (e) {
      toast.error('Erreur lors de la validation du comptage');
      throw e;
    }
  }, [counterType, addTransaction, drawerId, expectedAmountInMicrounits]);

  const triggerUnauthorizedOpen = useCallback(async () => {
    const roleLevel = PERMISSION_ROLE_LEVELS[currentOperatorRole as PermissionRole] ?? 0;
    if (roleLevel < MIN_ALERT_ROLE_LEVEL) {
      toast.error('Accès refusé — rôle insuffisant pour émettre une alerte caisse');
      return;
    }
    await NexusEventBus.emitDurable('cash_drawer.opened_unauthorized', {
      v: 1,
      drawerId,
      operatorId: currentOperatorId,
      tenantId,
      detectedAt: Date.now(),
    });
    toast.error('Alerte de sécurité envoyée');
  }, [drawerId, currentOperatorId, currentOperatorRole, tenantId]);

  return {
    expectedAmountInMicrounits,
    transactions,
    isCounterOpen,
    counterType,
    openCounter,
    closeCounter,
    handleValidateCount,
    triggerUnauthorizedOpen,
  };
}
