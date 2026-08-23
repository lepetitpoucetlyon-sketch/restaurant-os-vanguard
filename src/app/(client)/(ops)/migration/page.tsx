"use client";

import React, { useState } from "react";
import { FECImportPanel, ReservationHistoryImportPanel } from "@/modules/commerce";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { PageShell } from "@/shared/components/ui/PageShell";
import { ArrowRightLeft, FileSpreadsheet, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

function MigrationPage() {
  const [activeTab, setActiveTab] = useState<'fec' | 'reservations'>('fec');

  return (
    <PageShell
      title="Migration & Reprise d'Antériorité"
      subtitle="Importez vos archives comptables FEC et historiques de réservations (Zenchef, TheFork)."
      icon={ArrowRightLeft}
      breadcrumbs={[{ label: "Administration" }, { label: "Migration" }]}
      tabs={
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('fec')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'fec'
                ? "bg-action-primary text-text-on-primary shadow-sm"
                : "bg-surface-card border border-border-default text-text-muted hover:text-text-primary"
            )}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Grand Livre & FEC Comptable</span>
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'reservations'
                ? "bg-action-primary text-text-on-primary shadow-sm"
                : "bg-surface-card border border-border-default text-text-muted hover:text-text-primary"
            )}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Historique Réservations (Zenchef / TheFork)</span>
          </button>
        </div>
      }
    >
      <div className="p-6">
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
