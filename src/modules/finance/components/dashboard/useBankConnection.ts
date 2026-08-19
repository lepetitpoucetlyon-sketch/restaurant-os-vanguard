import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { BankAccount } from "../financeUtils";
import { applyBankSyncResult, performConnectBank } from "./bankConnectionHelpers";

interface BankConnectionState {
  bankModalOpen: boolean;
  bankWebviewUrl: string | null;
  connectingBank: boolean;
  syncingBank: boolean;
  bankAccounts: BankAccount[];
  loadingBankAccounts: boolean;
  setBankModalOpen: (open: boolean) => void;
  handleConnectBank: () => Promise<void>;
  handleBankSync: () => Promise<void>;
}

/**
 * useBankConnection — encapsule tout le cycle de connexion bancaire du FinanceDashboard.
 * Extrait du god file FinanceDashboard.tsx pour réduire son fan-out.
 */
export function useBankConnection(): BankConnectionState {
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankWebviewUrl, setBankWebviewUrl] = useState<string | null>(null);
  const [connectingBank, setConnectingBank] = useState(false);
  const [syncingBank, setSyncingBank] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingBankAccounts(true);
      try {
        const { Nexus } = await import("@/lib/nexus/NexusAdapter");
        const accounts = await Nexus.adapter.query<BankAccount>("bankAccounts");
        if (!cancelled) setBankAccounts(accounts);
      } catch {
        // Collection may be empty — no-op
      } finally {
        if (!cancelled) setLoadingBankAccounts(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleConnectBank = useCallback(async () => {
    await performConnectBank(setBankWebviewUrl, setBankModalOpen, setConnectingBank);
  }, []);

  const handleBankSync = useCallback(async () => {
    setSyncingBank(true);
    try {
      const res = await fetch("/api/finance/bank/sync", { method: "POST" });
      const data = (await res.json()) as { success?: boolean; isDemoMode?: boolean; error?: string };
      await applyBankSyncResult(data, setBankAccounts);
    } catch {
      toast.error("Erreur réseau lors de la synchronisation.");
    } finally {
      setSyncingBank(false);
    }
  }, []);

  return {
    bankModalOpen,
    bankWebviewUrl,
    connectingBank,
    syncingBank,
    bankAccounts,
    loadingBankAccounts,
    setBankModalOpen,
    handleConnectBank,
    handleBankSync,
  };
}
