'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { AirlockPipeline } from '../AirlockPipeline';
import type { LegacyImportConfig, IntegrationMode, LegacySourceSystem, MigrationReport, OpeningEntry } from '@nexus/contracts';

interface AirlockMigrationPanelProps {
  tenantId?: string;
}

const UI_STRINGS = {
  kicker: 'Sas de Décontamination Intelligent',
  title: 'Airlock — Reprise d\'Antériorité Sécurisée',
  subtitle: 'Importez vos données historiques d\'anciennes caisses sans corrompre le KDS ni la chaîne fiscale NF525 vivante.',
  loadSample: 'Charger échantillon démo',
  sourceLabel: 'Logiciel source :',
  modeLabel: 'Mode d\'intégration :',
  pontTitle: 'Mode PONT (Recommandé)',
  pontDesc: 'Écriture d\'ouverture seq=1 scellée + archives dans le coffre',
  sutureTitle: 'Mode SUTURE TOTALE (Historique complet)',
  sutureDesc: 'Coffre + miroir dans legacyOrders/ pour CRM et RAG',
  tabulaTitle: 'Mode TABULA RASA',
  tabulaDesc: 'Départ vierge sans reprise comptable',
  dropzoneDefault: 'Déposez votre fichier d\'export (CSV, Excel, JSON)',
  dropzoneHint: 'Cliquez ou glissez-déposez le fichier ici',
  launchButton: 'Lancer la décontamination & le scellement d\'ouverture',
  reportTitle: 'Rapport de Décontamination Airlock',
  totalIngested: 'Total ingéré',
  duplicatesMerged: 'Doublons fusionnés',
  archivesSaved: 'Archives enregistrées',
  legacyOrdersSaved: 'Commandes legacy',
  openingEntryTitle: 'Bilan d\'Ouverture NF525 Scellé',
  sequenceLabel: 'Séquence',
  sealedByLabel: 'Scellé par :',
};

const SOURCES: Array<{ id: LegacySourceSystem; label: string }> = [
  { id: 'zelty', label: 'Zelty' },
  { id: 'lightspeed', label: 'Lightspeed K-Series' },
  { id: 'square', label: 'Square POS' },
  { id: 'toast', label: 'Toast' },
  { id: 'clover', label: 'Clover' },
  { id: 'excel_manual', label: 'Excel / CSV Manuel' },
];

export function AirlockMigrationPanel({ tenantId = 'demo-restaurant' }: AirlockMigrationPanelProps) {
  const [sourceSystem, setSourceSystem] = useState<LegacySourceSystem>('zelty');
  const [integrationMode, setIntegrationMode] = useState<IntegrationMode>('PONT');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string | number | null>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [committedResult, setCommittedResult] = useState<{
    openingEntry?: OpeningEntry;
    archiveSaved: number;
    legacyOrdersSaved: number;
  } | null>(null);

  const handleLoadSampleData = () => {
    setSelectedFileName('zelty_export_2026_sample.csv');
    setRawRows([
      { id: 'Z-101', date: '2026-08-01', category: 'sales', total: '45.50', customer: 'Jean Dupont', ht: '37.92', tva: '7.58' },
      { id: 'Z-102', date: '2026-08-02', category: 'sales', total: '128.00', customer: 'Marie Curie', ht: '106.67', tva: '21.33' },
      { id: 'Z-103', date: '2026-08-02', category: 'sales', total: '128.00', customer: 'Marie Curie', ht: '106.67', tva: '21.33' },
      { id: 'Z-104', date: '2026-08-03', category: 'purchases', total: '840.00', supplier: 'Metro Cash&Carry', ht: '700.00', tva: '140.00' },
      { id: 'Z-105', date: '2026-08-04', category: 'sales', total: '32.00', customer: 'Paul Valéry', ht: '26.67', tva: '5.33' },
    ]);
  };

  const handleRunAirlock = async () => {
    if (rawRows.length === 0) return;
    setIsProcessing(true);
    setReport(null);
    setCommittedResult(null);

    const config: LegacyImportConfig = {
      sessionId: `airlock_${Date.now()}`,
      sourceSystem,
      format: 'csv',
      genesisDate: new Date().toISOString(),
      integrationMode,
      tenantId,
      initiatedBy: 'manager@restaurant.fr',
      startedAt: new Date().toISOString(),
    };

    const pipeline = new AirlockPipeline(config);

    setCurrentStage('1. PARSE — Analyse du format & rejet des lignes vides...');
    await new Promise((r) => setTimeout(r, 600));

    setCurrentStage('2. DEDUP — Détection intelligente des doublons...');
    await new Promise((r) => setTimeout(r, 700));

    setCurrentStage('3. VALIDATE — Audit fiscal (HT + TVA = TTC)...');
    await new Promise((r) => setTimeout(r, 600));

    setCurrentStage('4. ENRICH — Normalisation vers Restaurant OS...');
    await new Promise((r) => setTimeout(r, 500));

    const rep = await pipeline.execute(rawRows);
    setReport(rep);

    setCurrentStage('Scellement de l\'Écriture d\'Ouverture NF525...');
    const result = await pipeline.commit(integrationMode);
    setCommittedResult(result);

    setIsProcessing(false);
    setCurrentStage(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header explicatif */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-action-primary text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>{UI_STRINGS.kicker}</span>
          </div>
          <h2 className="text-xl font-extrabold text-text-primary">
            {UI_STRINGS.title}
          </h2>
          <p className="text-xs text-text-muted mt-1 max-w-xl">
            {UI_STRINGS.subtitle}
          </p>
        </div>

        <button
          type="button"
          aria-label={UI_STRINGS.loadSample}
          onClick={handleLoadSampleData}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-subtle border border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-action-primary" />
          <span>{UI_STRINGS.loadSample}</span>
        </button>
      </div>

      {/* Configuration d'import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source System */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-subtle border border-border-default">
          <label className="text-xs font-bold text-text-secondary">{UI_STRINGS.sourceLabel}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SOURCES.map((src) => (
              <button
                type="button"
                key={src.id}
                aria-label={src.label}
                onClick={() => setSourceSystem(src.id)}
                className={cn(
                  "p-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer",
                  sourceSystem === src.id
                    ? "bg-action-primary text-text-on-primary border-action-primary shadow-sm"
                    : "bg-surface-card border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default"
                )}
              >
                {src.label}
              </button>
            ))}
          </div>
        </div>

        {/* Integration Mode */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-subtle border border-border-default">
          <label className="text-xs font-bold text-text-secondary">{UI_STRINGS.modeLabel}</label>
          <div className="flex flex-col gap-2">
            {[
              {
                id: 'PONT' as IntegrationMode,
                title: UI_STRINGS.pontTitle,
                desc: UI_STRINGS.pontDesc,
              },
              {
                id: 'SUTURE_TOTALE' as IntegrationMode,
                title: UI_STRINGS.sutureTitle,
                desc: UI_STRINGS.sutureDesc,
              },
              {
                id: 'TABULA_RASA' as IntegrationMode,
                title: UI_STRINGS.tabulaTitle,
                desc: UI_STRINGS.tabulaDesc,
              },
            ].map((m) => (
              <button
                type="button"
                key={m.id}
                aria-label={m.title}
                onClick={() => setIntegrationMode(m.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between",
                  integrationMode === m.id
                    ? "bg-surface-card border-action-primary ring-1 ring-action-primary shadow-sm"
                    : "bg-surface-card border-border-subtle text-text-muted hover:border-border-default"
                )}
              >
                <div>
                  <div className="text-xs font-bold text-text-primary">{m.title}</div>
                  <div className="text-[11px] text-text-muted">{m.desc}</div>
                </div>
                {integrationMode === m.id && <CheckCircle2 className="w-4 h-4 text-action-primary mt-0.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dropzone accessible */}
      <button
        type="button"
        aria-label="Zone de dépôt de fichier d'export"
        onClick={handleLoadSampleData}
        className={cn(
          "w-full p-8 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer",
          selectedFileName
            ? "border-action-primary/50 bg-action-primary/5"
            : "border-border-default bg-surface-subtle hover:border-border-strong hover:bg-surface-card"
        )}
      >
        <div className="w-12 h-12 rounded-2xl bg-surface-card border border-border-default flex items-center justify-center text-action-primary shadow-sm">
          {selectedFileName ? <FileCheck className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
        </div>
        <div>
          <span className="text-sm font-bold text-text-primary">
            {selectedFileName || UI_STRINGS.dropzoneDefault}
          </span>
          <p className="text-xs text-text-muted mt-0.5">
            {selectedFileName
              ? `${rawRows.length} lignes prêtes pour l'Airlock Pipeline`
              : UI_STRINGS.dropzoneHint}
          </p>
        </div>
      </button>

      {/* Action Button */}
      <button
        type="button"
        aria-label={UI_STRINGS.launchButton}
        disabled={rawRows.length === 0 || isProcessing}
        onClick={handleRunAirlock}
        className={cn(
          "w-full py-4 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg",
          rawRows.length > 0 && !isProcessing
            ? "bg-action-primary text-text-on-primary hover:opacity-95"
            : "bg-surface-subtle border border-border-default text-text-muted cursor-not-allowed"
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{currentStage}</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>{UI_STRINGS.launchButton}</span>
          </>
        )}
      </button>

      {/* Rapport de Décontamination & Bilan d'Ouverture */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 p-6 rounded-3xl bg-surface-card border border-border-default shadow-md"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{UI_STRINGS.reportTitle}</span>
            </h3>
            <span className="text-xs font-mono text-text-muted">{report.sessionId}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle">
              <div className="text-[11px] text-text-muted">{UI_STRINGS.totalIngested}</div>
              <div className="text-base font-extrabold text-text-primary">{report.stats.totalDocumentsIngested}</div>
            </div>
            <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle">
              <div className="text-[11px] text-text-muted">{UI_STRINGS.duplicatesMerged}</div>
              <div className="text-base font-extrabold text-amber-500">{report.stats.duplicatesFound}</div>
            </div>
            <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle">
              <div className="text-[11px] text-text-muted">{UI_STRINGS.archivesSaved}</div>
              <div className="text-base font-extrabold text-action-primary">{committedResult?.archiveSaved ?? 0}</div>
            </div>
            <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle">
              <div className="text-[11px] text-text-muted">{UI_STRINGS.legacyOrdersSaved}</div>
              <div className="text-base font-extrabold text-emerald-500">{committedResult?.legacyOrdersSaved ?? 0}</div>
            </div>
          </div>

          {/* Écriture d'Ouverture Scellée */}
          {committedResult?.openingEntry && (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{UI_STRINGS.openingEntryTitle}</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                  {UI_STRINGS.sequenceLabel} #{committedResult.openingEntry.sequence}
                </span>
              </div>
              <div className="text-xs text-text-secondary font-mono truncate">
                Hash: {committedResult.openingEntry.fiscalSealHash}
              </div>
              <div className="text-[11px] text-text-muted">
                Précédent: {committedResult.openingEntry.previousHash} • {UI_STRINGS.sealedByLabel} {committedResult.openingEntry.sealedBy}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
