"use client";

import { useState } from "react";
import { Play, Loader2, ChevronRight, AlertTriangle } from "lucide-react";
import { useToast } from "@ui/Toast";
import { useDataMigration } from "@/shared/hooks/useDataMigration";
import { UniversalImportDropzone } from "@/modules/onboarding/migration/UniversalImportDropzone";
import { OnboardingProgress } from "@/modules/onboarding/migration/OnboardingProgress";
import { CATEGORY_CONFIGS } from "@/modules/onboarding/migration/types";
import type { ImportCategory } from "@/modules/onboarding/migration/types";

const IMPORT_CATEGORIES: ImportCategory[] = [
  'floorplan',
  'menu',
  'staff',
  'suppliers',
  'inventory',
  'recipes',
  'crm',
  'reservations',
  'statements',
  'fec',
];

const ORDER_LABELS: Record<ImportCategory, string> = {
  floorplan:    '1. Plan de salle',
  menu:         '2. Menu / Carte',
  staff:        '3. Équipe',
  suppliers:    '4. Fournisseurs',
  inventory:    '5. Stocks',
  recipes:      '6. Recettes',
  crm:          '7. Clients',
  reservations: '8. Réservations passées',
  statements:   '9. Relevés bancaires',
  fec:          '10. FEC historique',
};

export default function MigrationSettings() {
  const { showToast } = useToast();
  const { seedProduction, isMigrating } = useDataMigration();
  const [active, setActive] = useState<ImportCategory | 'seed'>('floorplan');

  const handleSeed = async () => {
    try {
      await seedProduction();
      showToast("Données de démonstration injectées !", "success");
    } catch (e) {
      showToast(`Erreur : ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">
      <header>
        <h1 className="text-4xl font-serif font-light tracking-tight text-text-primary">
          Migration <span className="italic text-accent">&amp; Import</span>
        </h1>
        <p className="text-text-muted mt-2">
          Glissez-déposez n'importe quel fichier — détection automatique du logiciel source, encodage, et format.
        </p>
      </header>

      <div className="flex gap-6">
        {/* Sidebar — onboarding order */}
        <aside className="w-56 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Ordre recommandé</p>
          <nav className="space-y-1">
            {IMPORT_CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIGS[cat];
              const isActive = active === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={[
                    'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-all',
                    isActive
                      ? 'bg-accent/10 text-accent font-semibold'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary',
                  ].join(' ')}
                >
                  <span className="text-base shrink-0">{cfg.icon}</span>
                  <span className="truncate">{ORDER_LABELS[cat]}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
                </button>
              );
            })}

            <div className="pt-2 mt-2 border-t border-border">
              <button
                onClick={() => setActive('seed')}
                className={[
                  'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-all',
                  active === 'seed'
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary',
                ].join(' ')}
              >
                <span className="text-base shrink-0">🌱</span>
                <span>Données de démo</span>
                {active === 'seed' && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
              </button>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Onboarding checklist — always visible */}
          <div className="rounded-xl border border-border bg-bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">
              Progression d'onboarding
            </h2>
            <OnboardingProgress />
          </div>

          {active !== 'seed' && (
            <>
              {/* Dependency warning */}
              {CATEGORY_CONFIGS[active].requiresOrder && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-action-primary/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Conseil : importer d'abord{' '}
                    {CATEGORY_CONFIGS[active].requiresOrder!
                      .map(c => CATEGORY_CONFIGS[c].label)
                      .join(', ')}{' '}
                    pour des liaisons optimales.
                  </span>
                </div>
              )}

              <UniversalImportDropzone
                key={active}
                category={active}
                onComplete={result => {
                  showToast(
                    `${CATEGORY_CONFIGS[active].label} : ${result.created} créés, ${result.updated} mis à jour, ${result.skipped} ignorés.`,
                    result.errors.length > 0 ? 'warning' : 'success'
                  );
                }}
              />
            </>
          )}

          {active === 'seed' && (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <div>
                <h3 className="font-semibold">Données de démonstration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Injecte un restaurant italien complet (catégories, plats, ingrédients, stocks, recette). Utile pour les démonstrations client.
                </p>
              </div>
              <button
                onClick={handleSeed}
                disabled={isMigrating}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {isMigrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isMigrating ? 'Injection…' : 'Injecter les données de démo'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
