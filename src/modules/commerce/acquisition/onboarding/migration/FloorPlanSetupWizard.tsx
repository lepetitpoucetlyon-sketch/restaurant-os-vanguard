'use client';

/**
 * FloorPlanSetupWizard — mig-14
 * Onboarding guidé plan de salle : zones → batch tables → aperçu → sauvegarde.
 * Utilise Nexus.adapter.batch() pour écrire toutes les tables en une transaction.
 */

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toError } from "@/lib/toError";
import { BatchTableForm, type WizardTable } from './floor-plan/BatchTableForm';
import { SingleTableForm } from './floor-plan/SingleTableForm';
import { FloorPlanZonesStep, type ZoneName } from './floor-plan/FloorPlanZonesStep';
import { FloorPlanPreviewStep } from './floor-plan/FloorPlanPreviewStep';
import { FloorPlanDoneView } from './floor-plan/FloorPlanDoneView';

import { useLanguage } from "@/shared/hooks";
type WizardStep = 'zones' | 'tables' | 'preview';

export default function FloorPlanSetupWizard() {
    const { t } = useLanguage();
  const [step, setStep] = useState<WizardStep>('zones');
  const [selectedZones, setSelectedZones] = useState<ZoneName[]>(['Salle']);
  const [tables, setTables] = useState<WizardTable[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function toggleZone(zone: ZoneName) {
    setSelectedZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    );
  }

  const addTables = useCallback((toAdd: WizardTable[]) => {
    setTables(prev => [...prev, ...toAdd]);
  }, []);

  const addSingleTable = useCallback((t: WizardTable) => {
    setTables(prev => [...prev, t]);
  }, []);

  function removeTable(key: string) {
    setTables(prev => prev.filter(t => t._key !== key));
  }

  function updateTable(key: string, field: keyof WizardTable, value: string | number) {
    setTables(prev =>
      prev.map(t => (t._key === key ? { ...t, [field]: value } : t))
    );
  }

  async function handleSave() {
    if (tables.length === 0) { toast.error('Aucune table à sauvegarder.'); return; }
    setSaving(true);
    try {
      const batch = Nexus.adapter.batch();
      for (const t of tables) {
        const id = `table-${t.zone.toLowerCase().replace(/\s+/g, '-')}-${t.number}`;
        const zoneId = `zone-${t.zone.toLowerCase().replace(/\s+/g, '-')}`;
        batch.set<Record<string, unknown>>(`tables/${id}`, {
          id,
          type: 'table',
          number: t.number,
          seats: t.seats,
          shape: t.shape,
          status: 'free',
          zoneId,
          x: 0,
          y: 0,
          schemaVersion: 2,
          updatedAt: Date.now(),
        });
      }
      await batch.commit();
      setDone(true);
      toast.success(`${tables.length} table(s) sauvegardée(s) avec succès !`);
    } catch (err) {
      toast.error(`Erreur sauvegarde : ${toError(err).message}`);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <FloorPlanDoneView
        tablesCount={tables.length}
        zonesCount={selectedZones.length}
        onReset={() => { setDone(false); setStep('zones'); setTables([]); setSelectedZones(['Salle']); }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <header>
        <h2 className="text-xl font-semibold text-text-primary">{t('commerce.onboarding.guidedFloorPlan')}</h2>
        <p className="text-sm text-text-muted mt-1">
          Créez vos zones et tables en quelques étapes. Les tables seront disponibles immédiatement dans les Réservations et le POS.
        </p>
      </header>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['zones', 'tables', 'preview'] as WizardStep[]).map((s, i) => {
          const labels: Record<WizardStep, string> = { zones: '1. Zones', tables: '2. Tables', preview: '3. Aperçu' };
          const isActive = step === s;
          const isPast = ['zones', 'tables', 'preview'].indexOf(step) > i;
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className={[
                  'px-3 py-1 rounded-full font-medium transition-colors',
                  isActive ? 'bg-accent text-text-primary' : isPast ? 'bg-accent/20 text-accent' : 'bg-bg-secondary text-text-muted',
                ].join(' ')}
              >
                {labels[s]}
              </span>
              {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
            </div>
          );
        })}
      </div>

      {/* STEP 1 */}
      {step === 'zones' && (
        <FloorPlanZonesStep
          selectedZones={selectedZones}
          toggleZone={toggleZone}
          onNext={() => selectedZones.length > 0 && setStep('tables')}
        />
      )}

      {/* STEP 2 */}
      {step === 'tables' && (
        <div className="space-y-6">
          {selectedZones.map(zone => (
            <div key={zone} className="space-y-3">
              <h3 className="font-semibold text-text-primary border-b border-border pb-1">Zone : {zone}</h3>
              <BatchTableForm zone={zone} onAdd={addTables} />
              <SingleTableForm zone={zone} onAdd={addSingleTable} />
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep('zones')}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">{tables.length} table(s) ajoutée(s)</span>
              <button
                onClick={() => tables.length > 0 && setStep('preview')}
                disabled={tables.length === 0}
                className="flex items-center gap-2 rounded-lg bg-text-primary text-bg-primary px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Aperçu <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 'preview' && (
        <FloorPlanPreviewStep
          tables={tables}
          updateTable={updateTable}
          removeTable={removeTable}
          onBack={() => setStep('tables')}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
