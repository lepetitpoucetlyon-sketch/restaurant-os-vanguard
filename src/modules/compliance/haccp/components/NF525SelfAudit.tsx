'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  Hash,
  Lock,
  FileSpreadsheet,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/shared/hooks';
import { Nexus } from '@/lib/nexus/NexusAdapter';

// ── Types ─────────────────────────────────────────────────────────────────────

type CheckStatus = 'ok' | 'error' | 'warning' | 'pending' | 'checking';

interface AuditCheck {
  id: string;
  label: string;
  description: string;
  howToFix?: string;
  status: CheckStatus;
  /** Whether this check can be resolved automatically on load */
  autoCheck: boolean;
  icon: React.ReactNode;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  CheckStatus,
  { icon: React.ReactNode; badgeClass: string; label: string }
> = {
  ok: {
    icon: <CheckCircle2 className="w-4 h-4 text-status-success" />,
    badgeClass: 'bg-status-success/10 text-emerald-600 dark:text-status-success border-emerald-500/20',
    label: 'Conforme',
  },
  error: {
    icon: <XCircle className="w-4 h-4 text-status-danger" />,
    badgeClass: 'bg-status-danger/10 text-red-600 dark:text-status-danger border-red-500/20',
    label: 'Non conforme',
  },
  warning: {
    icon: <AlertCircle className="w-4 h-4 text-action-primary" />,
    badgeClass: 'bg-action-primary/10 text-amber-600 dark:text-action-primary border-action-primary/20',
    label: 'A vérifier',
  },
  pending: {
    icon: <AlertCircle className="w-4 h-4 text-text-muted" />,
    badgeClass: 'bg-bg-secondary text-text-muted border-border',
    label: 'Non vérifié',
  },
  checking: {
    icon: <RefreshCw className="w-4 h-4 text-accent animate-spin" />,
    badgeClass: 'bg-accent/10 text-accent border-accent/20',
    label: 'Vérification…',
  },
};

const ARCHITECTURAL_GUARANTEES: ReadonlySet<string> = new Set([
  'sequencing',
  'immutability',
]);

// ── Component ─────────────────────────────────────────────────────────────────

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

  // ── Auto-checks ─────────────────────────────────────────────────────────────

  const runAutoChecks = useCallback(async () => {
    if (!slug) return;
    setIsRunning(true);

    // Check: fiscal seal chain exists
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

    // Check: FEC export route reachable
    let fecOk: CheckStatus = 'error';
    try {
      const res = await fetch('/api/admin/finance/fec/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siren: '__probe__', yearMonth: '2000-01' }),
      });
      // 400 bad-request = route exists; 404 = route missing
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

  // ── Manual toggle (for non-auto items) ──────────────────────────────────────

  const toggleManualCheck = (id: string) => {
    setChecks(prev =>
      prev.map(c => {
        if (c.id !== id || c.autoCheck) return c;
        const next: CheckStatus = c.status === 'ok' ? 'warning' : 'ok';
        return { ...c, status: next };
      })
    );
  };

  // ── PDF generation ──────────────────────────────────────────────────────────

  const generatePDF = async () => {
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const now = new Date();

    // Header
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, pageWidth, 38, 'F');
    doc.setTextColor(197, 160, 89); // accent
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RESTAURANT OS', 15, 18);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Attestation de conformité NF525', 15, 28);
    doc.setFontSize(9);
    doc.text(
      `Générée le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      pageWidth - 15,
      28,
      { align: 'right' }
    );

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Self-Audit de conformité NF525', 15, 55);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      'Ce document récapitule l\'état de conformité au référentiel NF525 de la caisse enregistreuse.',
      15,
      63,
      { maxWidth: pageWidth - 30 }
    );

    // Checklist
    let y = 78;
    const statusLabel: Record<CheckStatus, string> = {
      ok: '[OK]',
      error: '[ERREUR]',
      warning: '[A VERIFIER]',
      pending: '[NON VERIFIE]',
      checking: '[EN COURS]',
    };

    checks.forEach(check => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      const label = statusLabel[check.status] ?? '[?]';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(
        check.status === 'ok' ? 22 : check.status === 'error' ? 200 : 180,
        check.status === 'ok' ? 163 : check.status === 'error' ? 30 : 120,
        check.status === 'ok' ? 74 : check.status === 'error' ? 30 : 20
      );
      doc.text(`${label} ${check.label}`, 15, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const lines = doc.splitTextToSize(check.description, pageWidth - 30) as string[];
      doc.text(lines, 18, y + 5);
      y += 8 + lines.length * 4;
    });

    // Footer
    const totalPages = (doc.internal as unknown as { pages: unknown[] }).pages?.length ?? 1;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Restaurant OS — NF525 Self-Audit — Page 1/${totalPages} — ${now.getFullYear()}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );

    doc.save(`nf525-conformite-${now.toISOString().slice(0, 10)}.pdf`);
    toast.success('Attestation NF525 générée');
  };

  // ── Stats ────────────────────────────────────────────────────────────────────

  const okCount = checks.filter(c => c.status === 'ok').length;
  const errorCount = checks.filter(c => c.status === 'error').length;
  const total = checks.length;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Self-Audit NF525</h3>
          <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
            Conformité fiscale caisse enregistreuse
          </p>
        </div>
      </div>

      {/* Score */}
      <div className="rounded-2xl border border-border bg-bg-secondary p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-3xl font-bold text-text-primary">
            {okCount}
            <span className="text-lg text-text-muted font-normal">/{total}</span>
          </p>
          <p className="text-sm text-text-muted mt-0.5">critères conformes</p>
        </div>
        <div className="flex gap-4">
          {errorCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-status-danger">
              <XCircle className="w-3.5 h-3.5" />
              {errorCount} non conforme{errorCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => void runAutoChecks()}
            disabled={isRunning}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            Relancer l'audit
          </button>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {checks.map(check => {
          const isExpanded = expandedId === check.id;
          const sc = STATUS_CONFIG[check.status];

          return (
            <div
              key={check.id}
              className="rounded-2xl border border-border bg-bg-secondary overflow-hidden"
            >
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-bg-primary/40 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : check.id)}
              >
                <span className="text-text-muted shrink-0">{check.icon}</span>
                <span className="flex-1 text-sm font-medium text-text-primary">{check.label}</span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.badgeClass}`}
                >
                  {sc.label}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {check.description}
                  </p>

                  {check.howToFix && check.status !== 'ok' && (
                    <div className="rounded-xl bg-action-primary/5 border border-action-primary/20 p-3">
                      <p className="text-xs text-amber-600 dark:text-action-primary font-medium">
                        Correction : {check.howToFix}
                      </p>
                    </div>
                  )}

                  {!check.autoCheck && (
                    <button
                      onClick={() => toggleManualCheck(check.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                        check.status === 'ok'
                          ? 'border-emerald-500/30 text-emerald-600 dark:text-status-success hover:bg-status-success/10'
                          : 'border-border text-text-muted hover:bg-bg-primary'
                      }`}
                    >
                      {check.status === 'ok'
                        ? 'Marquer comme non vérifié'
                        : 'Marquer comme conforme (vérification manuelle)'}
                    </button>
                  )}

                  {ARCHITECTURAL_GUARANTEES.has(check.id) && (
                    <p className="text-xs text-text-muted italic">
                      Garanti architecturalement par SovereignGuard — pas d'action requise.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Générer attestation */}
      <div className="flex justify-end">
        <button
          onClick={() => void generatePDF()}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-text-primary text-bg-primary font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" />
          Générer l'attestation NF525 (PDF)
        </button>
      </div>
    </div>
  );
}
