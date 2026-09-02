"use client";

import React, { useState } from "react";
import { FECImportPanel, ReservationHistoryImportPanel } from "@/modules/commerce";
import { AirlockMigrationPanel } from "@/modules/intelligence";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { PageShell } from "@/shared/components/ui/PageShell";
import { ArrowRightLeft, FileSpreadsheet, CalendarCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

const UI_STRINGS = {
  kicker: "Reprise d'antériorité & Airlock",
  title: "Migration & Décontamination",
  subtitle: "Importez vos archives d'anciennes caisses, écritures FEC et historiques de réservations sans polluer le KDS.",
  adminBreadcrumb: "Administration",
  migrationBreadcrumb: "Migration",
  tabAirlock: "Sas Airlock (Zelty / Lightspeed / Square)",
  tabFec: "Grand Livre & FEC Comptable",
  tabReservations: "Historique Réservations (Zenchef / TheFork)",
};

function MigrationPage() {
  const [activeTab, setActiveTab] = useState<'airlock' | 'fec' | 'reservations'>('airlock');

  return (
    <PageShell
      kicker={UI_STRINGS.kicker}
      title={UI_STRINGS.title}
      subtitle={UI_STRINGS.subtitle}
      icon={ArrowRightLeft}
      breadcrumbs={[{ label: UI_STRINGS.adminBreadcrumb }, { label: UI_STRINGS.migrationBreadcrumb }]}
      tabs={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-label={UI_STRINGS.tabAirlock}
            onClick={() => setActiveTab('airlock')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === 'airlock'
                ? "bg-action-primary text-text-on-primary shadow-sm"
                : "bg-surface-card border border-border-default text-text-muted hover:text-text-primary"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.tabAirlock}</span>
          </button>

          <button
            type="button"
            aria-label={UI_STRINGS.tabFec}
            onClick={() => setActiveTab('fec')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === 'fec'
                ? "bg-action-primary text-text-on-primary shadow-sm"
                : "bg-surface-card border border-border-default text-text-muted hover:text-text-primary"
            )}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.tabFec}</span>
          </button>

          <button
            type="button"
            aria-label={UI_STRINGS.tabReservations}
            onClick={() => setActiveTab('reservations')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === 'reservations'
                ? "bg-action-primary text-text-on-primary shadow-sm"
                : "bg-surface-card border border-border-default text-text-muted hover:text-text-primary"
            )}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.tabReservations}</span>
          </button>
        </div>
      }
    >
      <div className="p-6">
        {activeTab === 'airlock' && (
          <div className="bg-surface-card border border-border-default rounded-3xl p-6 shadow-sm">
            <AirlockMigrationPanel />
          </div>
        )}

        {activeTab === 'fec' && (
          <div className="bg-surface-card border border-border-default rounded-3xl p-6 shadow-sm">
            <FECImportPanel />
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="bg-surface-card border border-border-default rounded-3xl p-6 shadow-sm">
            <ReservationHistoryImportPanel />
          </div>
        )}
      </div>
    </PageShell>
  );
}

export default withPageGuard(MigrationPage, "migration");
