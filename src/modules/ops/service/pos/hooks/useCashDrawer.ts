"use client";

import { useState, useCallback } from "react";
import { useToast } from "@components/ui/Toast";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { empireAudit } from "@/lib/audit";
import { PERMISSION_ROLE_LEVELS, type PermissionRole } from "@/shared/nexus/contracts/permissions.types";

const MIN_ALERT_ROLE_LEVEL = PERMISSION_ROLE_LEVELS['hotesse']; // 30 — tout le personnel de salle

interface CashTransaction {
  id: string;
  type: 'SKIM' | 'DROP' | 'SALE' | 'REFUND';
  amountInCents: number;
  timestamp: number;
  operatorId: string;
}

export function useCashDrawer(
  drawerId: string,
  tenantId: string,
  currentOperatorId: string,
  currentOperatorRole: string = 'plongeur',
) {
  const { showToast } = useToast();
  
  const [expectedAmountInCents, setExpectedAmountInCents] = useState(15000); // Ex: fond de caisse 150€
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [isCounterOpen, setIsCounterOpen] = useState(false);
  const [counterType, setCounterType] = useState<'EOD_CLOSE' | 'SKIM' | 'DROP'>('EOD_CLOSE');

  const addTransaction = useCallback((type: 'SKIM' | 'DROP' | 'SALE' | 'REFUND', amountInCents: number) => {
    const tx: CashTransaction = {
      id: crypto.randomUUID(),
      type,
      amountInCents,
      timestamp: Date.now(),
      operatorId: currentOperatorId
    };
    
    setTransactions(prev => [...prev, tx]);
    
    if (type === 'SKIM') {
      setExpectedAmountInCents(prev => prev - amountInCents);
    } else if (type === 'DROP' || type === 'SALE') {
      setExpectedAmountInCents(prev => prev + amountInCents);
    } else if (type === 'REFUND') {
      setExpectedAmountInCents(prev => prev - amountInCents);
    }
  }, [currentOperatorId]);

  const openCounter = useCallback((type: 'EOD_CLOSE' | 'SKIM' | 'DROP') => {
    setCounterType(type);
    setIsCounterOpen(true);
  }, []);

  const closeCounter = useCallback(() => {
    setIsCounterOpen(false);
  }, []);

  const handleValidateCount = useCallback(async (countedAmountInCents: number, discrepancyInCents: number) => {
    try {
      if (counterType === 'SKIM') {
        addTransaction('SKIM', countedAmountInCents);
        showToast(`Prélèvement de ${countedAmountInCents / 100}€ enregistré.`, 'success');
      } else if (counterType === 'DROP') {
        addTransaction('DROP', countedAmountInCents);
        showToast(`Dépôt de ${countedAmountInCents / 100}€ enregistré.`, 'success');
      } else if (counterType === 'EOD_CLOSE') {
        // Log the end of day discrepancy
        empireAudit.log({
          module: 'finance',
          action: 'CASH_DRAWER_COUNTED',
          details: {
            drawerId,
            expectedAmountInCents,
            countedAmountInCents,
            discrepancyInCents,
            expectedAmountInMicrounits: expectedAmountInCents * 10_000,
            countedAmountInMicrounits: countedAmountInCents * 10_000,
            discrepancyInMicrounits: discrepancyInCents * 10_000,
          },
          severity: Math.abs(discrepancyInCents) > 500 ? 'high' : 'low',
          timestamp: new Date(),
        });
        showToast(`Caisse comptée. Écart: ${discrepancyInCents / 100}€`, 'success');
      }
    } catch (e) {
      showToast('Erreur lors de la validation du comptage', 'error');
    }
  }, [counterType, addTransaction, showToast, drawerId, expectedAmountInCents]);

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
    expectedAmountInCents,
    transactions,
    isCounterOpen,
    counterType,
    openCounter,
    closeCounter,
    handleValidateCount,
    triggerUnauthorizedOpen
  };
}
