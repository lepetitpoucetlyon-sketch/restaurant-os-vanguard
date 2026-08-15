'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '@/lib/client/authedFetch';
import type { ConnectorId, ConnectorCredentials } from '@/modules/commerce/acquisition/onboarding/migration/connectors/types';
import type { ImportCategory } from '@/modules/commerce/acquisition/onboarding/migration/types';
import type { OnboardingMode } from '@/shared/nexus/contracts/onboarding.types';
import { ProgressStepper, type WizardStep } from './ProgressStepper';
import { SourceSystemSelector } from './SourceSystemSelector';
import { ConnectorOAuthPanel } from './ConnectorOAuthPanel';
import { ImportCategoryPanel } from './ImportCategoryPanel';
import { SimpleFloorPlanEditor, type SimpleTable, type SimpleZone } from './SimpleFloorPlanEditor';
import { OnboardingHelpButton } from './OnboardingHelpButton';

interface ImportEntry {
  category: ImportCategory;
  label: string;
  icon: string;
  requiredForZero: boolean;
  requiredForMigration: boolean;
}

const IMPORT_ENTRIES: ImportEntry[] = [
  { category: 'menu',         label: 'Menu & Produits',     icon: '🍽️',  requiredForZero: true,  requiredForMigration: true },
  { category: 'floorplan',    label: 'Plan de salle',       icon: '🪑',  requiredForZero: true,  requiredForMigration: false },
  { category: 'staff',        label: 'Équipe',              icon: '👥',  requiredForZero: true,  requiredForMigration: true },
  { category: 'suppliers',    label: 'Fournisseurs',        icon: '🏭',  requiredForZero: false, requiredForMigration: true },
  { category: 'inventory',    label: 'Stocks initiaux',     icon: '📦',  requiredForZero: false, requiredForMigration: true },
  { category: 'crm',          label: 'Clients CRM',        icon: '👤',  requiredForZero: false, requiredForMigration: true },
  { category: 'reservations', label: 'Historique résa',    icon: '📅',  requiredForZero: false, requiredForMigration: true },
  { category: 'fec',          label: 'FEC Comptable',       icon: '📊',  requiredForZero: false, requiredForMigration: true },
  { category: 'statements',   label: 'Relevés bancaires',   icon: '🏦',  requiredForZero: false, requiredForMigration: false },
  { category: 'recipes',      label: 'Recettes',            icon: '📋',  requiredForZero: false, requiredForMigration: false },
];

type WizardStepId = 'mode' | 'source' | 'connect' | 'import' | 'done';

const WIZARD_STEPS: WizardStep[] = [
  { id: 'mode',    label: 'Profil',    icon: '🏪' },
  { id: 'source',  label: 'Source',   icon: '🔌' },
  { id: 'connect', label: 'Connexion', icon: '🔑' },
  { id: 'import',  label: 'Import',   icon: '📥' },
  { id: 'done',    label: 'Prêt',     icon: '🚀' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStepId>('mode');
  const [completedSteps, setCompletedSteps] = useState<WizardStepId[]>([]);
  const [mode, setMode] = useState<OnboardingMode | null>(null);
  const [connectorId, setConnectorId] = useState<ConnectorId | null>(null);
  const [credentials, setCredentials] = useState<ConnectorCredentials | null>(null);
  const [importedCategories, setImportedCategories] = useState<ImportCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<ImportCategory | null>(null);

  const complete = (step: WizardStepId, next: WizardStepId) => {
    setCompletedSteps(s => [...s, step]);
    setCurrentStep(next);
  };

  const handleModeSelect = (m: OnboardingMode) => {
    setMode(m);
    if (m === 'from_zero') {
      complete('mode', 'import');
    } else {
      complete('mode', 'source');
    }
    void authedFetch('/api/tenant/onboarding/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: m }),
    });
  };

  const handleSourceSelect = (id: ConnectorId) => {
    setConnectorId(id);
    complete('source', 'connect');
  };

  const handleConnected = (creds: ConnectorCredentials) => {
    setCredentials(creds);
    complete('connect', 'import');
  };

  const handleImported = useCallback((cat: ImportCategory) => {
    setImportedCategories(prev => prev.includes(cat) ? prev : [...prev, cat]);
  }, []);

  const handleDone = () => {
    complete('import', 'done');
    void authedFetch('/api/tenant/onboarding/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });
  };

  const relevantEntries = IMPORT_ENTRIES.filter(e =>
    mode === 'from_zero' ? e.requiredForZero : e.requiredForMigration
  );

  const requiredDone = relevantEntries
    .filter(e => mode === 'from_zero' ? e.requiredForZero : e.requiredForMigration)
    .every(e => importedCategories.includes(e.category));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-4xl mb-2">🚀</div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenue sur Restaurant OS</h1>
          <p className="text-gray-500 mt-1">Quelques étapes pour être prêt à ouvrir</p>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <ProgressStepper
            steps={WIZARD_STEPS.filter(s =>
              mode !== 'from_zero' || !['source', 'connect'].includes(s.id)
            )}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* STEP: MODE */}
          {currentStep === 'mode' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Comment souhaitez-vous démarrer ?</h2>
              <p className="text-sm text-gray-500">Votre choix détermine le parcours d&apos;installation</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <button
                  onClick={() => handleModeSelect('from_zero')}
                  className="p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-left transition-all group"
                >
                  <div className="text-3xl mb-2">✨</div>
                  <div className="font-semibold text-gray-800 group-hover:text-indigo-700">Démarrer de zéro</div>
                  <p className="text-sm text-gray-500 mt-1">Nouveau restaurant ou nouvelle activité</p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-400">
                    <li>✓ Menu à créer</li>
                    <li>✓ Plan de salle à configurer</li>
                    <li>✓ Équipe à ajouter</li>
                  </ul>
                </button>
                <button
                  onClick={() => handleModeSelect('migration')}
                  className="p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-left transition-all group"
                >
                  <div className="text-3xl mb-2">🔄</div>
                  <div className="font-semibold text-gray-800 group-hover:text-indigo-700">Migrer depuis un autre logiciel</div>
                  <p className="text-sm text-gray-500 mt-1">Importer vos données existantes</p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-400">
                    <li>✓ Menu & produits</li>
                    <li>✓ Clients & historique</li>
                    <li>✓ Comptabilité</li>
                  </ul>
                </button>
              </div>
            </div>
          )}

          {/* STEP: SOURCE */}
          {currentStep === 'source' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Quel logiciel utilisez-vous actuellement ?</h2>
              <p className="text-sm text-gray-500">
                Sélectionnez votre caisse, logiciel de réservation ou de comptabilité
              </p>
              <SourceSystemSelector selected={connectorId} onSelect={handleSourceSelect} />
            </div>
          )}

          {/* STEP: CONNECT */}
          {currentStep === 'connect' && connectorId && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Connectez votre compte</h2>
              <ConnectorOAuthPanel
                connectorId={connectorId}
                onConnected={handleConnected}
              />
              <button
                onClick={() => { setCurrentStep('import'); setCompletedSteps(s => [...s, 'connect']); }}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-2"
              >
                Je préfère importer des fichiers manuellement →
              </button>
            </div>
          )}

          {/* STEP: IMPORT */}
          {currentStep === 'import' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Import des données</h2>
                <span className="text-sm text-gray-500">
                  {importedCategories.length}/{relevantEntries.length} catégories
                </span>
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-2">
                {relevantEntries.map(entry => {
                  const done = importedCategories.includes(entry.category);
                  const active = activeCategory === entry.category;
                  return (
                    <button
                      key={entry.category}
                      onClick={() => setActiveCategory(active ? null : entry.category)}
                      className={[
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                        done ? 'bg-emerald-100 text-emerald-700' :
                          active ? 'bg-indigo-100 text-indigo-700' :
                          'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      ].join(' ')}
                    >
                      <span>{entry.icon}</span>
                      <span>{entry.label}</span>
                      {done && <span className="text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Active category panel */}
              {activeCategory && activeCategory !== 'floorplan' && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <ImportCategoryPanel
                    category={activeCategory}
                    categoryLabel={relevantEntries.find(e => e.category === activeCategory)?.label ?? activeCategory}
                    categoryIcon={relevantEntries.find(e => e.category === activeCategory)?.icon ?? '📄'}
                    connectorId={connectorId ?? undefined}
                    connectorCredentials={credentials ?? undefined}
                    onImported={() => {
                      handleImported(activeCategory);
                      setActiveCategory(null);
                    }}
                  />
                </div>
              )}

              {/* Floor plan editor — special case */}
              {activeCategory === 'floorplan' && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🪑</span>
                    <h3 className="font-semibold text-gray-900">Plan de salle</h3>
                  </div>
                  <SimpleFloorPlanEditor
                    onSave={async (tables: SimpleTable[], zones: SimpleZone[]) => {
                      await authedFetch('/api/tenant/onboarding/status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ steps: { floorplan: { status: 'completed', source: 'manual', importResult: { created: tables.length, updated: 0, skipped: 0, errors: 0 } } } }),
                      });
                      handleImported('floorplan');
                      setActiveCategory(null);
                    }}
                  />
                </div>
              )}

              {!activeCategory && (
                <div className="text-center py-4 text-sm text-gray-400">
                  Cliquez sur une catégorie pour importer ses données
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Les catégories facultatives peuvent être complétées plus tard
                </p>
                <button
                  onClick={handleDone}
                  disabled={!requiredDone && importedCategories.length === 0}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* STEP: DONE */}
          {currentStep === 'done' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-bold text-gray-900">Vous êtes prêt à ouvrir !</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                {importedCategories.length} catégorie{importedCategories.length > 1 ? 's' : ''} importée{importedCategories.length > 1 ? 's' : ''}.
                Vous pouvez compléter le reste depuis les paramètres à tout moment.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <button
                  onClick={() => router.push('/pos')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Ouvrir la caisse
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Aller au tableau de bord
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer: aide + rollback hint */}
        {currentStep !== 'done' && (
          <div className="flex items-center justify-between mt-4">
            <OnboardingHelpButton currentStep={currentStep} category={activeCategory ?? undefined} />
            {importedCategories.length > 0 && (
              <p className="text-xs text-gray-400">
                Chaque import est sauvegardé — annulation possible depuis les paramètres
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
