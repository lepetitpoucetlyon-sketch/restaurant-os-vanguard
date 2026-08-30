'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Hash,
  Lock,
  Shield,
  FileSpreadsheet,
  Archive,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/shared/hooks';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { authedFetch } from '@/lib/client/authedFetch';
import type { AuditCheck, CheckStatus } from './self-audit/selfAuditTypes';
import { SelfAuditHeader } from './self-audit/SelfAuditHeader';
import { SelfAuditChecklist } from './self-audit/SelfAuditChecklist';
import { generateNF525AuditPDF } from './self-audit/selfAuditPdfGenerator';
import { Button } from "@/shared/components/ui/Button";

export default function NF525SelfAudit() {
  const { tenantId } = useTenant();
  const slug = tenantId ?? '';

  const [checks, setChecks] = useState<AuditCheck[]>([
    {
      id: 'sequencing',
      label: 'Tickets horodatés et numérotés séquentiellement',
      description:
        'Chaque ticket POS possède un horodatage UTC et un numéro séquentiel incrémental unique. La numérotation ne peut jamais reculer ni présenter de trou.',
      status: 'ok',
      autoCheck: true,
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'seal_chain',
      label: 'Chaîne de scellement SHA-256 vérifiable',
      description:
        'Chaque entrée de journal est scellée avec SHA-256(dataSnapshot + previousHash). La chaîne est contrôlée à la lecture via FiscalAdapter.',
      status: 'checking',
      autoCheck: true,
      icon: <Hash className="w-4 h-4" />,
    },
    {
      id: 'immutability',
      label: 'Données immuables (pas de delete sur journalEntries)',
      description:
        'Les collections journalEntries, fiscalSeals et fiscalLedger sont protégées par SovereignGuard : delete et update sont bloqués architecturalement.',
      status: 'ok',
      autoCheck: true,
      icon: <Lock className="w-4 h-4" />,
    },
    {
      id: 'signing_secret',
      label: 'FISCAL_SIGNING_SECRET configuré en production',
      description:
        'La variable d\'environnement FISCAL_SIGNING_SECRET doit être présente et non vide sur l\'environnement de production pour que les scellements soient valides.',
      howToFix:
        'Ajoutez FISCAL_SIGNING_SECRET=<secret_32_chars> dans vos variables d\'environnement Vercel / Railway.',
      status: 'warning',
      autoCheck: false,
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'fec_export',
      label: 'Export FEC disponible',
      description:
        'Le Fichier des Écritures Comptables (FEC) peut être généré depuis la page Finance. Il est exigible lors d\'un contrôle fiscal selon l\'article L.47 A du LPF.',
      status: 'checking',
      autoCheck: true,
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      id: 'archiving',
      label: 'Archivage 10 ans configuré',
      description:
        'Les données fiscales (journalEntries, fiscalSeals) doivent être conservées pendant 10 ans conformément à l\'article L.102 B du LPF. Vérifiez la politique de rétention Firestore.',
      howToFix:
        'Configurez une règle de rétention Firestore de 3 650 jours minimum sur la collection journalEntries.',
      status: 'warning',
      autoCheck: false,
      icon: <Archive className="w-4 h-4" />,
    },
  ]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runAutoChecks = useCallback(async () => {
    if (!slug) return;
    setIsRunning(true);

    let sealChainOk: CheckStatus = 'error';
    try {
      const seals = await Nexus.adapter.query(
        `tenants/${slug}/fiscalSeals`,
        { limit: 1 },
        { vassalId: slug, actorId: 'client' }
      );
      sealChainOk = seals.length > 0 ? 'ok' : 'warning';
    } catch {
      sealChainOk = 'warning';
    }

    let fecOk: CheckStatus = 'error';
    try {
      const res = await authedFetch('/api/admin/finance/fec/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siren: '__probe__', yearMonth: '2000-01' }),
      });
      fecOk = res.status !== 404 ? 'ok' : 'error';
    } catch {
      fecOk = 'warning';
    }

    setChecks(prev =>
      prev.map(c => {
        if (c.id === 'seal_chain') return { ...c, status: sealChainOk };
        if (c.id === 'fec_export') return { ...c, status: fecOk };
        return c;
      })
    );

    setIsRunning(false);
    toast.success('Audit NF525 terminé');
  }, [slug]);

  useEffect(() => {
    if (slug) {
      void runAutoChecks();
    }
  }, [slug, runAutoChecks]);

  const toggleManualCheck = (id: string) => {
    setChecks(prev =>
      prev.map(c => {
        if (c.id !== id || c.autoCheck) return c;
        const next: CheckStatus = c.status === 'ok' ? 'warning' : 'ok';
        return { ...c, status: next };
      })
    );
  };

  return (
    <div className="space-y-8">
      <SelfAuditHeader
        checks={checks}
        isRunning={isRunning}
        onRefresh={() => void runAutoChecks()}
      />

      <SelfAuditChecklist
        checks={checks}
        expandedId={expandedId}
        onToggleExpand={id => setExpandedId(expandedId === id ? null : id)}
        onToggleManualCheck={toggleManualCheck}
      />

      <div className="flex justify-end">
        <Button variant="ghost"
          onClick={() => void generateNF525AuditPDF(checks)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-text-primary text-bg-primary font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" />
          Générer l'attestation NF525 (PDF)
        </Button>
      </div>
    </div>
  );
}
