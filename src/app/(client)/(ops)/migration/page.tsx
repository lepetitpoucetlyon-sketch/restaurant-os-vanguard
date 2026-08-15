"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { withPageGuard } from "@design/rbac/PageGuard";
import { cn } from '@/lib/ui.foundations';
import { BookOpen, FileSpreadsheet, ArrowLeftRight } from 'lucide-react';

const FECImportPanel = dynamic(
  () => import('@/modules/commerce/acquisition/onboarding/migration/FECImportPanel')
    .then(m => ({ default: m.FECImportPanel })),
  { loading: () => <p className="p-10 text-center text-text-muted italic">Chargement…</p> }
);

const ReservationHistoryImportPanel = dynamic(
  () => import('@/modules/commerce/acquisition/onboarding/migration/ReservationHistoryImportPanel')
    .then(m => ({ default: m.ReservationHistoryImportPanel })),
  { loading: () => <p className="p-10 text-center text-text-muted italic">Chargement…</p> }
);

type Tab = 'fec' | 'reservations';

function MigrationContent() {
  const [tab, setTab] = useState<Tab>('fec');

  return (
    <div className="flex flex-col min-h-screen bg-surface-base">
      <header className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <ArrowLeftRight className="w-5 h-5 text-action-primary" />
          <h1 className="text-xl font-serif font-bold text-text-primary">Migration &amp; Import</h1>
        </div>
        <p className="text-sm text-text-muted">Importez vos données historiques depuis votre ancien logiciel.</p>
      </header>

      <nav className="flex gap-1 border-b border-border px-4 pt-2">
        {([
          { id: 'fec'          as Tab, label: 'Comptabilité FEC',          icon: FileSpreadsheet },
          { id: 'reservations' as Tab, label: 'Historique Réservations',   icon: BookOpen },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === id
                ? 'border-action-primary text-action-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 p-6">
        {tab === 'fec'          && <FECImportPanel />}
        {tab === 'reservations' && <ReservationHistoryImportPanel />}
      </div>
    </div>
  );
}

function MigrationPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-serif italic text-text-muted">Initialisation du Nexus…</div>}>
      <MigrationContent />
    </Suspense>
  );
}

export default withPageGuard(MigrationPage, "migration");
