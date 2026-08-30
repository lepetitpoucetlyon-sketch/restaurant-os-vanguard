"use client";

import React, { useState, useEffect } from "react";
import { BedDouble, Search } from "lucide-react";
import { PageShell } from "@/shared/components/ui/PageShell";
import { StatGrid, StatCard } from "@/shared/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/ui.foundations";
import { toast } from "sonner";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { useTenant } from "@/shared/hooks/useTenant";
import { toMicrounits } from "@/shared/schemas/primitives";
import { SharedKernel } from "@/lib/shared-kernel";
import { logger } from "@/lib/logger";

interface RoomFolio {
  roomNumber: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: 'occupied' | 'reserved' | 'cleaning' | 'available';
  balanceInMicrounits: number;
  pmsSyncStatus: 'synced' | 'pending' | 'error';
}

const SAMPLE_ROOMS: RoomFolio[] = [
  { roomNumber: "101", guestName: "M. Jean Dupont", checkIn: "2026-08-20", checkOut: "2026-08-25", status: "occupied", balanceInMicrounits: toMicrounits(145.0), pmsSyncStatus: "synced" },
  { roomNumber: "102", guestName: "Mme Claire Martin", checkIn: "2026-08-22", checkOut: "2026-08-24", status: "occupied", balanceInMicrounits: toMicrounits(42.0), pmsSyncStatus: "synced" },
  { roomNumber: "103", guestName: "—", checkIn: "—", checkOut: "—", status: "available", balanceInMicrounits: toMicrounits(0.0), pmsSyncStatus: "synced" },
  { roomNumber: "201", guestName: "M. Thomas Miller", checkIn: "2026-08-21", checkOut: "2026-08-26", status: "occupied", balanceInMicrounits: toMicrounits(320.0), pmsSyncStatus: "synced" },
  { roomNumber: "202", guestName: "Mme Sophie Bernard", checkIn: "2026-08-23", checkOut: "2026-08-24", status: "occupied", balanceInMicrounits: toMicrounits(85.0), pmsSyncStatus: "pending" },
  { roomNumber: "203", guestName: "—", checkIn: "—", checkOut: "—", status: "cleaning", balanceInMicrounits: toMicrounits(0.0), pmsSyncStatus: "synced" },
];

export function PmsPage() {
  const tenant = useTenant();
  const tenantId = tenant?.activeTenantId ?? null;
  const [rooms, setRooms] = useState<RoomFolio[]>(SAMPLE_ROOMS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    setIsLoading(true);
    Nexus.adapter.query<RoomFolio & { id: string }>(`tenants/${tenantId}/rooms`)
      .then((docs) => {
        if (cancelled) return;
        if (Array.isArray(docs) && docs.length > 0) {
          setRooms(docs as unknown as RoomFolio[]);
        }
        // Sinon on garde SAMPLE_ROOMS comme fallback demo (tenant vierge)
      })
      .catch((err) => {
        logger.warn("[PMS] Chargement rooms échoué, fallback demo", err);
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [tenantId]);

  const filteredRooms = rooms.filter((r) => {
    const matchSearch = r.roomNumber.includes(search) || r.guestName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalOccupied = rooms.filter((r) => r.status === "occupied").length;
  const totalBalanceMu = rooms.reduce((sum, r) => sum + r.balanceInMicrounits, 0);

  const handleChargeRoom = async (room: RoomFolio) => {
    if (room.status !== 'occupied') {
      toast.error(`La chambre ${room.roomNumber} n'est pas occupée`);
      return;
    }
    if (!tenantId) {
      toast.error("Contexte tenant absent : impossible d'imputer.");
      return;
    }
    const input = window.prompt(`Imputer une note sur la chambre ${room.roomNumber} (${room.guestName})\nMontant en euros (€) :`, "25.00");
    if (!input) return;
    const amount = parseFloat(input.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    const chargeMu = toMicrounits(amount);
    const nextBalanceMu = room.balanceInMicrounits + chargeMu;
    const chargeId = SharedKernel.generateId("FOLIO-CHARGE");
    try {
      const now = new Date().toISOString();
      // 1) Ligne de folio persistée (append-only pour audit)
      await Nexus.adapter.set(`tenants/${tenantId}/folios/${room.roomNumber}/charges/${chargeId}`, {
        id: chargeId,
        roomNumber: room.roomNumber,
        guestName: room.guestName,
        description: "Room service",
        amountInMicrounits: chargeMu,
        chargedAt: now,
      });
      // 2) Mise à jour du solde du folio
      await Nexus.adapter.set(`tenants/${tenantId}/rooms/${room.roomNumber}`, {
        ...room,
        balanceInMicrounits: nextBalanceMu,
        updatedAt: now,
      });
      // 3) Cascade métier — le sceau NF525 intervient au check-out, pas à l'imputation
      await NexusEventBus.emit("hotel.folio_charged", {
        tenantId,
        guestId: room.guestName || room.roomNumber,
        reservationId: room.roomNumber,
        amountInMicrounits: chargeMu,
        description: `Room service — chambre ${room.roomNumber}`,
      });
      setRooms(prev => prev.map(r => r.roomNumber === room.roomNumber ? { ...r, balanceInMicrounits: nextBalanceMu } : r));
      toast.success(`Note de ${amount.toFixed(2)}€ imputée sur la chambre ${room.roomNumber}`);
    } catch (err) {
      logger.error("[PMS] Imputation folio échouée", err);
      toast.error("Impossible d'enregistrer l'imputation — réessaie.");
    }
  };

  return (
    <PageShell
      kicker="Hôtellerie"
      title="PMS & Chambres"
      subtitle="Facturation chambre, transferts d'addition restaurant et passerelle PMS hôtelière."
      icon={BedDouble}
      breadcrumbs={[{ label: "Opérations" }, { label: "PMS & Chambres" }]}
    >
      <div className="p-6 space-y-6">
        <StatGrid columns={3}>
          <StatCard label="Taux d'Occupation Chambres" value={`${Math.round((totalOccupied / rooms.length) * 100)}%`} />
          <StatCard label="Encours Room Service & Repas" value={formatCurrency(totalBalanceMu / 1_000_000)} />
          <StatCard label="Connecteur PMS Actif" value="Mews PMS (Connecté)" />
        </StatGrid>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une chambre ou un client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-surface-card border border-border-default text-xs text-text-primary focus:outline-none focus:border-action-primary"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {['all', 'occupied', 'available', 'cleaning'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer",
                  filterStatus === st
                    ? "bg-action-primary text-text-on-primary shadow-sm"
                    : "bg-surface-card border border-border-default text-text-muted hover:text-text-primary"
                )}
              >
                {st === 'all' ? 'Toutes' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <div
              key={room.roomNumber}
              className="bg-surface-card border border-border-default rounded-2xl p-5 space-y-4 hover:border-action-primary/30 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border-default pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-action-primary/10 text-action-primary flex items-center justify-center font-serif font-black text-base">
                    {room.roomNumber}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">{room.guestName}</h3>
                    <span className="text-nano text-text-muted">Séjour: {room.checkIn} → {room.checkOut}</span>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-nano font-bold uppercase",
                  room.status === 'occupied' ? "bg-status-success/10 text-status-success" :
                  room.status === 'available' ? "bg-action-primary/10 text-action-primary" : "bg-status-warning/10 text-status-warning"
                )}>
                  {room.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-nano text-text-muted uppercase font-bold">Encours Folio</span>
                  <p className="text-base font-mono font-bold text-text-primary mt-0.5">{formatCurrency(room.balanceInMicrounits / 1_000_000)}</p>
                </div>
                <button 
                  onClick={() => handleChargeRoom(room)}
                  className="px-3 py-1.5 rounded-xl bg-surface-bg border border-border-default text-xs font-bold text-text-primary hover:border-action-primary transition-all cursor-pointer"
                >
                  Imputer une note
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
