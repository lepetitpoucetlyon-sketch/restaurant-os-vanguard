"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, X, CheckCircle2 } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { IdGenerator } from "@/lib/utils/IdGenerator";
import { toast } from "sonner";
import type { CashDrawerSession } from "./cash-drawer/cashDrawerTypes";
import { parseEuros, eurosToMicrounits } from "./cash-drawer/cashDrawerTypes";
import { CashDrawerOpenSection } from "./cash-drawer/CashDrawerOpenSection";
import { CashDrawerCloseSection } from "./cash-drawer/CashDrawerCloseSection";

export type { CashDrawerSession };

interface CashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  userId: string;
  collectedInMicrounits?: number;
  changeGivenInMicrounits?: number;
}

export function CashDrawerModal({
  isOpen,
  onClose,
  tenantId,
  userId,
  collectedInMicrounits = 0,
  changeGivenInMicrounits = 0,
}: CashDrawerModalProps) {
  const [session, setSession] = useState<CashDrawerSession | null>(null);
  const [isFetchingSession, setIsFetchingSession] = useState(false);

  const [openingInput, setOpeningInput] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  const [actualInput, setActualInput] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [closed, setClosed] = useState(false);

  const loadActiveSession = useCallback(async () => {
    setIsFetchingSession(true);
    try {
      const path = `tenants/${tenantId}/cashDrawerSessions`;
      const sessions = await Nexus.adapter.query<CashDrawerSession>(path, {
        where: [{ field: "closedAt", operator: "==", value: null }],
        orderBy: { field: "openedAt", direction: "desc" },
        limit: 1,
      });
      setSession(sessions[0] ?? null);
    } catch {
      setSession(null);
    } finally {
      setIsFetchingSession(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (isOpen) {
      setClosed(false);
      setActualInput("");
      loadActiveSession();
    }
  }, [isOpen, loadActiveSession]);

  const handleOpen = useCallback(async () => {
    const euros = parseEuros(openingInput);
    if (euros <= 0) {
      toast.error("Saisissez un montant d'ouverture valide");
      return;
    }
    setIsOpening(true);
    try {
      const sessionId = IdGenerator.generateWithPrefix("cds");
      const newSession: CashDrawerSession = {
        id: sessionId,
        openedAt: new Date().toISOString(),
        openingInMicrounits: eurosToMicrounits(euros),
        collectedInMicrounits: 0,
        changeGivenInMicrounits: 0,
        userId,
      };
      const path = `tenants/${tenantId}/cashDrawerSessions/${sessionId}`;
      const batch = Nexus.adapter.batch();
      batch.set(path, newSession);
      await batch.commit();
      setSession(newSession);
      const { cashDrawerService } = await import('@/modules/ops');
      void cashDrawerService.kick();
      toast.success(`Caisse ouverte — Fond : ${euros.toFixed(2)} €`);
    } catch {
      toast.error("Impossible d'ouvrir la caisse");
    } finally {
      setIsOpening(false);
    }
  }, [openingInput, tenantId, userId]);

  const handleClose = useCallback(async () => {
    if (!session) return;
    const actualEuros = parseEuros(actualInput);
    if (actualEuros < 0) {
      toast.error("Montant réel invalide");
      return;
    }
    setIsClosing(true);
    try {
      const actualMu = eurosToMicrounits(actualEuros);
      const theoreticalMu =
        session.openingInMicrounits + collectedInMicrounits - changeGivenInMicrounits;

      const path = `tenants/${tenantId}/cashDrawerSessions/${session.id}`;
      const batch = Nexus.adapter.batch();
      batch.set(path, {
        ...session,
        closedAt: new Date().toISOString(),
        closingInMicrounits: actualMu,
        collectedInMicrounits,
        changeGivenInMicrounits,
      });
      await batch.commit();

      const diffMu = actualMu - theoreticalMu;
      const sign = diffMu >= 0 ? "+" : "";
      toast.success(
        `Caisse clôturée — Écart : ${sign}${(diffMu / 1_000_000).toFixed(2)} €`
      );
      setClosed(true);
      setSession(null);
    } catch {
      toast.error("Impossible de clôturer la caisse");
    } finally {
      setIsClosing(false);
    }
  }, [session, actualInput, collectedInMicrounits, changeGivenInMicrounits, tenantId]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="cd-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-8 sm:pb-0"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        aria-hidden="true"
      >
        <motion.div
          key="cd-card"
          role="dialog"
          aria-modal="true"
          aria-label="Gestion du fond de caisse"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="bg-surface-card border border-border rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full sm:w-[440px] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-accent-gold" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">
                  Fond de caisse
                </h3>
                <p className="text-nano text-text-muted uppercase tracking-wider">
                  {session ? "Session en cours" : closed ? "Session clôturée" : "Aucune session ouverte"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {isFetchingSession ? (
            <div className="flex items-center justify-center py-8 text-text-muted">
              <div className="w-5 h-5 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
            </div>
          ) : closed ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-status-success" />
              <p className="text-sm font-black uppercase tracking-wider text-text-primary">
                Caisse clôturée
              </p>
              <p className="text-micro text-text-muted">
                Résultats enregistrés dans Nexus
              </p>
              <button
                onClick={onClose}
                className="mt-2 w-full h-12 rounded-full bg-bg-tertiary text-micro font-black uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : !session ? (
            <CashDrawerOpenSection
              openingInput={openingInput}
              isOpening={isOpening}
              onChangeOpeningInput={setOpeningInput}
              onOpen={handleOpen}
            />
          ) : (
            <CashDrawerCloseSection
              session={session}
              collectedInMicrounits={collectedInMicrounits}
              changeGivenInMicrounits={changeGivenInMicrounits}
              actualInput={actualInput}
              isClosing={isClosing}
              onChangeActualInput={setActualInput}
              onCloseSession={handleClose}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
