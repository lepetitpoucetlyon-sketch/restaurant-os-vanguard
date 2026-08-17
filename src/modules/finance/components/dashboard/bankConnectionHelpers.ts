import { toast } from "sonner";
import type { Order } from "@nexus/contracts";
import type { BankAccount } from "../financeUtils";

export function filterPaidOrders(orders: Order[]): Order[] {
    return orders.filter(o => o.status === "paid" || (o as { status?: string }).status === "served");
}

export async function applyBankSyncResult(
    data: { success?: boolean; isDemoMode?: boolean; error?: string },
    setBankAccounts: (accounts: BankAccount[]) => void,
): Promise<void> {
    if (data.success) {
        toast.success(data.isDemoMode ? "Synchronisation simulée (mode démo)." : "Synchronisation bancaire lancée.");
        const { Nexus } = await import("@/lib/nexus/NexusAdapter");
        setBankAccounts(await Nexus.adapter.query<BankAccount>("bankAccounts"));
    } else {
        toast.error(data.error ?? "Erreur lors de la synchronisation.");
    }
}

export async function performConnectBank(
    setBankWebviewUrl: (url: string) => void,
    setBankModalOpen: (open: boolean) => void,
    setConnectingBank: (b: boolean) => void,
): Promise<void> {
    setConnectingBank(true);
    try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const res = await fetch(`/api/finance/bank/webview?origin=${encodeURIComponent(origin)}`);
        if (!res.ok) throw new Error("Erreur serveur");
        const { url } = (await res.json()) as { url: string; isDemoMode?: boolean };
        setBankWebviewUrl(url);
        setBankModalOpen(true);
    } catch {
        toast.error("Impossible d'ouvrir la connexion bancaire.");
    } finally {
        setConnectingBank(false);
    }
}
