"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { FECExportPage } from '@/modules/finance';
import { withPageGuard } from "@design/rbac/PageGuard";
import { cn } from '@/lib/ui.foundations';
import { FileSpreadsheet, ShieldCheck } from 'lucide-react';

const NF525SelfAudit = dynamic(
  () => import('@/modules/compliance/qualite/haccp/components/NF525SelfAudit'),
  { loading: () => <div className="p-10 text-center text-text-muted italic">Chargement de l&apos;audit…</div> }
);

type Tab = 'export' | 'audit';

function NF525Page() {
  const [tab, setTab] = useState<Tab>('export');

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="flex gap-1 border-b border-border px-4 pt-2">
        {([
          { id: 'export' as Tab, label: 'Export FEC / Clôture Z', icon: FileSpreadsheet },
          { id: 'audit'  as Tab, label: 'Auto-audit NF525',       icon: ShieldCheck  },
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

      <div className="flex-1">
        {tab === 'export' && <FECExportPage />}
        {tab === 'audit'  && <NF525SelfAudit />}
      </div>
    </div>
  );
}

export default withPageGuard(NF525Page, "finance");
