'use client';

import React, { useState } from 'react';
import { Network, Shield, Scale, Cpu, Lock, Globe, MessageSquare, Award, DollarSign, Database, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

interface DeriverSpec {
  id: string;
  name: string;
  category: string;
  icon: typeof Shield;
  description: string;
  sampleOutput: Record<string, unknown>;
}

const DERIVERS: DeriverSpec[] = [
  { id: 'rbac', name: 'RbacDeriver', category: 'Sécurité & Accès', icon: Lock, description: 'Dérivation automatique des matrices de permissions et rôles selon le tier et les modules activés.', sampleOutput: { roles: ['DIRECTOR', 'MANAGER', 'STAFF'], pinProtectedActions: ['seal_zday', 'void_line', 'cash_count'] } },
  { id: 'business_laws', name: 'BusinessLawsDeriver', category: 'Lois Métier', icon: Scale, description: 'Application des invariants fiscaux et opérationnels (NF525, HACCP, pas de stock négatif).', sampleOutput: { nf525Enforced: true, requireActiveClockIn: true, maxSplitCount: 20 } },
  { id: 'rgpd', name: 'RgpdDeriver', category: 'Conformité', icon: Shield, description: 'Règles de rétention, anonymisation et purge automatique des données clients.', sampleOutput: { customerRetentionDays: 1095, telemetryPurgeDays: 90, requireConsentCheckbox: true } },
  { id: 'security', name: 'SecurityDeriver', category: 'Sécurité Réseau', icon: Lock, description: 'Politique de session, isolation multi-tenant et filtrage IP / mTLS.', sampleOutput: { sessionTimeoutMinutes: 60, strictOriginValidation: true, outboxEncryption: 'AES-256-GCM' } },
  { id: 'legal', name: 'LegalDeriver', category: 'Juridique', icon: Scale, description: 'Mentions légales, TVA applicable et obligations de facturation.', sampleOutput: { cgvTemplate: 'MDD_RESTO_V3', defaultVatRate: 10.0, eInvoicingFacturXReady: true } },
  { id: 'localization', name: 'LocalizationDeriver', category: 'International', icon: Globe, description: 'Devise par défaut, format de date, fuseau horaire et langue.', sampleOutput: { currency: 'EUR', timezone: 'Europe/Paris', locale: 'fr-FR' } },
  { id: 'hardware_sizing', name: 'HardwareSizingDeriver', category: 'Matériel', icon: Cpu, description: 'Dimensionnement des imprimantes, bornes et terminaux selon le flux.', sampleOutput: { thermalPrinters: 2, posTerminals: 3, connectedSensors: 4 } },
  { id: 'integrations', name: 'IntegrationsDeriver', category: 'Connecteurs', icon: Network, description: 'Connecteurs tiers préconisés (UberEats, Deliveroo, Pennylane, Stripe).', sampleOutput: { accountingConnector: 'Pennylane', deliveryConnectors: ['UberEats', 'Deliveroo'] } },
  { id: 'comms', name: 'CommsDeriver', category: 'Notifications', icon: MessageSquare, description: 'Canaux de communication prioritaires (SMS, WhatsApp, Push brigade).', sampleOutput: { enableSmsAlerts: true, pushToRoleEnabled: true } },
  { id: 'formation', name: 'FormationDeriver', category: 'Onboarding Staff', icon: Award, description: 'Guides et tutoriels obligatoires selon les responsabilités du rôle.', sampleOutput: { requiredModules: ['HACCP_BASICS', 'POS_ENCAISSEMENT', 'SCELLAGE_FISCAL'] } },
  { id: 'pricing', name: 'PricingDeriver', category: 'Facturation MCC', icon: DollarSign, description: 'Tarification de l’instance selon les modules et le volume de transactions.', sampleOutput: { monthlyBaseCents: 9900, addonKdsCents: 2900, supportTier: 'PRIORITY' } },
  { id: 'backup', name: 'BackupDeriver', category: 'Résilience', icon: Database, description: 'Fréquence des snapshots et réplication multi-région du grand livre.', sampleOutput: { snapshotIntervalHours: 4, coldStorageRetentionMonths: 72 } },
];

export function DeriversTab() {
  const [selectedDeriverId, setSelectedDeriverId] = useState<string>('rbac');

  const activeDeriver = DERIVERS.find((d) => d.id === selectedDeriverId) || DERIVERS[0];
  const Icon = activeDeriver.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border-default backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider">
              Forge Stack P2b/c/d • 11 Dérivateurs C.10
            </span>
          </div>
          <h2 className="text-xl font-black text-text-primary">Inspecteur des Dérivateurs Systémiques</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Génération déterministe des configurations de sécurité, juridique, matériel, RGPD, KPI et tarification.
          </p>
        </div>
      </div>

      {/* Grid Dérivateurs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Derivers Nav */}
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 elegant-scrollbar">
          {DERIVERS.map((d) => {
            const isSelected = d.id === selectedDeriverId;
            const DIcon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDeriverId(d.id)}
                className={cn(
                  "w-full p-3.5 rounded-2xl text-left border transition-all flex items-center gap-3",
                  isSelected
                    ? "bg-violet-600/10 border-violet-500/50 text-text-primary shadow-md shadow-violet-500/5"
                    : "bg-surface-glass border-border-default text-text-muted hover:text-text-primary hover:bg-surface-glass-hover"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl",
                  isSelected ? "bg-violet-500/20 text-violet-400" : "bg-surface-card text-text-muted"
                )}>
                  <DIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs truncate">{d.name}</div>
                  <div className="text-nano text-text-muted">{d.category}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Deriver Details */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-surface-card border border-border-default space-y-6">
          <div className="flex items-center justify-between border-b border-border-default pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-nano uppercase font-bold text-violet-400">{activeDeriver.category}</span>
                <h3 className="text-xl font-bold text-text-primary mt-0.5">{activeDeriver.name}</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              ✓ Deterministic Pure Function
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Description Métier</span>
            <p className="text-xs text-text-secondary bg-surface-glass p-4 rounded-2xl border border-border-default leading-relaxed">
              {activeDeriver.description}
            </p>
          </div>

          <div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Sortie JSON Dérivée (Simulation Runtime)</span>
            <pre className="p-4 rounded-2xl bg-surface-glass border border-border-default font-mono text-xs text-emerald-400 overflow-x-auto">
              {JSON.stringify(activeDeriver.sampleOutput, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
