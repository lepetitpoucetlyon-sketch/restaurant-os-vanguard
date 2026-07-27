'use client';

/**
 * FloorPlanSetupWizard — mig-14
 * Onboarding guidé plan de salle : zones → batch tables → aperçu → sauvegarde.
 * Utilise Nexus.adapter.batch() pour écrire toutes les tables en une transaction.
 */

import { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronRight, ChevronLeft, Save, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Nexus } from '@/lib/nexus/NexusAdapter';

// ── Types ─────────────────────────────────────────────────────────────────────

type TableShape = 'rect' | 'circle';

interface WizardTable {
  /** Clé temporaire pour le rendering */
  _key: string;
  zone: string;
  number: string;
  seats: number;
  shape: TableShape;
}

type WizardStep = 'zones' | 'tables' | 'preview';

// ── Constants ────────────────────────────────────────────────────────────────

const AVAILABLE_ZONES = ['Salle', 'Terrasse', 'Bar', 'Salon privé'] as const;
type ZoneName = (typeof AVAILABLE_ZONES)[number];

const SHAPE_LABELS: Record<TableShape, string> = {
  rect: 'Rectangulaire',
  circle: 'Ronde',
};

let _keyCounter = 0;
function nextKey() {
  return `wt-${++_keyCounter}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface BatchFormProps {
  zone: string;
  onAdd: (tables: WizardTable[]) => void;
}

function BatchTableForm({ zone, onAdd }: BatchFormProps) {
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(10);
  const [seats, setSeats] = useState(4);
  const [shape, setShape] = useState<TableShape>('rect');

  function handleGenerate() {
    if (from > to) { toast.error('Le numéro de début doit être ≤ au numéro de fin.'); return; }
    if (to - from > 99) { toast.error('Maximum 100 tables à la fois.'); return; }
    const tables: WizardTable[] = [];
    for (let n = from; n <= to; n++) {
      tables.push({ _key: nextKey(), zone, number: String(n), seats, shape });
    }
    onAdd(tables);
    toast.success(`${tables.length} table(s) ajoutée(s) à la zone "${zone}".`);
  }

  return (
    <div className="rounded-lg border border-border bg-bg-tertiary p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Ajout en lot — {zone}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="space-y-1">
          <span className="text-xs text-text-muted">De (numéro)</span>
          <input
            type="number"
            min={1}
            value={from}
            onChange={e => setFrom(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-md border border-border bg-bg-primary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-text-muted">À (numéro)</span>
          <input
            type="number"
            min={1}
            value={to}
            onChange={e => setTo(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-md border border-border bg-bg-primary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-text-muted">Capacité</span>
          <input
            type="number"
            min={1}
            max={50}
            value={seats}
            onChange={e => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-md border border-border bg-bg-primary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-text-muted">Forme</span>
          <select
            value={shape}
            onChange={e => setShape(e.target.value as TableShape)}
            className="w-full rounded-md border border-border bg-bg-primary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="rect">Rectangulaire</option>
            <option value="circle">Ronde</option>
          </select>
        </label>
      </div>
      <button
        onClick={handleGenerate}
        className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Générer {to >= from ? to - from + 1 : 0} table(s)
      </button>
    </div>
  );
}

interface SingleTableFormProps {
  zone: string;
  onAdd: (table: WizardTable) => void;
}

function SingleTableForm({ zone, onAdd }: SingleTableFormProps) {
  const [number, setNumber] = useState('');
  const [seats, setSeats] = useState(4);
  const [shape, setShape] = useState<TableShape>('rect');

  function handleAdd() {
    if (!number.trim()) { toast.error('Numéro de table requis.'); return; }
    onAdd({ _key: nextKey(), zone, number: number.trim(), seats, shape });
    setNumber('');
    toast.success(`Table ${number} ajoutée.`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-bg-tertiary p-3">
      <p className="w-full text-xs font-semibold uppercase tracking-widest text-text-muted mb-0">Ajout manuel — {zone}</p>
      <label className="space-y-1 flex-1 min-w-[80px]">
        <span className="text-xs text-text-muted">Numéro</span>
        <input
          type="text"
          placeholder="ex: 12A"
          value={number}
          onChange={e => setNumber(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-primary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
        />
      </label>
      <label className="space-y-1 flex-1 min-w-[80px]">
        <span className="text-xs text-text-muted">Capacité</span>
        <input
          type="number"
          min={1}
          max={50}
          value={seats}
          onChange={e => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full rounded-md border border-border bg-bg-primary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
        />
      </label>
      <label className="space-y-1 flex-1 min-w-[100px]">
        <span className="text-xs text-text-muted">Forme</span>
        <select
          value={shape}
          onChange={e => setShape(e.target.value as TableShape)}
          className="w-full rounded-md border border-border bg-bg-primary px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="rect">Rectangulaire</option>
          <option value="circle">Ronde</option>
        </select>
      </label>
      <button
        onClick={handleAdd}
        className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors px-3 py-2 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Ajouter
      </button>
    </div>
  );
}

// ── Main Wizard ────────────────────────────────────────────────────────────────

export default function FloorPlanSetupWizard() {
  const [step, setStep] = useState<WizardStep>('zones');
  const [selectedZones, setSelectedZones] = useState<ZoneName[]>(['Salle']);
  const [tables, setTables] = useState<WizardTable[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // ── Step 1 : zones ──────────────────────────────────────────────────────────

  function toggleZone(zone: ZoneName) {
    setSelectedZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    );
  }

  // ── Step 2 : tables ─────────────────────────────────────────────────────────

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

  // ── Step 3 : save ───────────────────────────────────────────────────────────

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
      toast.error(`Erreur sauvegarde : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary">Plan de salle enregistré</h2>
        <p className="text-sm text-text-muted max-w-sm">
          {tables.length} table(s) créées dans {selectedZones.length} zone(s).
          Elles sont maintenant disponibles dans le module Réservations et le POS.
        </p>
        <button
          onClick={() => { setDone(false); setStep('zones'); setTables([]); setSelectedZones(['Salle']); }}
          className="mt-2 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:border-accent/40 transition-colors"
        >
          Recommencer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <header>
        <h2 className="text-xl font-semibold text-text-primary">Plan de salle guidé</h2>
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
                  isActive ? 'bg-accent text-white' : isPast ? 'bg-accent/20 text-accent' : 'bg-bg-secondary text-text-muted',
                ].join(' ')}
              >
                {labels[s]}
              </span>
              {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1 : Zones ── */}
      {step === 'zones' && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Sélectionnez les zones que possède votre établissement :</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AVAILABLE_ZONES.map(zone => {
              const selected = selectedZones.includes(zone);
              return (
                <button
                  key={zone}
                  onClick={() => toggleZone(zone)}
                  className={[
                    'rounded-xl border-2 p-4 text-sm font-medium transition-all',
                    selected
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-bg-secondary text-text-muted hover:border-accent/40 hover:text-text-primary',
                  ].join(' ')}
                >
                  {zone}
                </button>
              );
            })}
          </div>
          {selectedZones.length === 0 && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Sélectionnez au moins une zone.</p>
          )}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => selectedZones.length > 0 && setStep('tables')}
              disabled={selectedZones.length === 0}
              className="flex items-center gap-2 rounded-lg bg-text-primary text-bg-primary px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 : Tables ── */}
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

      {/* ── STEP 3 : Preview & Save ── */}
      {step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Vérifiez et modifiez les tables avant de sauvegarder. Toutes les tables seront créées en une seule opération.
          </p>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-text-muted text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Zone</th>
                  <th className="px-4 py-3 text-left">Numéro</th>
                  <th className="px-4 py-3 text-left">Capacité</th>
                  <th className="px-4 py-3 text-left">Forme</th>
                  <th className="px-4 py-3 text-left">ID Nexus</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tables.map(t => (
                  <tr key={t._key} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-2 text-text-muted">{t.zone}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={t.number}
                        onChange={e => updateTable(t._key, 'number', e.target.value)}
                        className="w-20 rounded border border-border bg-transparent px-2 py-0.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={t.seats}
                        onChange={e => updateTable(t._key, 'seats', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 rounded border border-border bg-transparent px-2 py-0.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={t.shape}
                        onChange={e => updateTable(t._key, 'shape', e.target.value)}
                        className="rounded border border-border bg-bg-secondary px-2 py-0.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                      >
                        <option value="rect">{SHAPE_LABELS.rect}</option>
                        <option value="circle">{SHAPE_LABELS.circle}</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-text-muted">
                      table-{t.zone.toLowerCase().replace(/\s+/g, '-')}-{t.number}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeTable(t._key)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Supprimer cette table"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep('tables')}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Retour
            </button>
            <button
              onClick={handleSave}
              disabled={saving || tables.length === 0}
              className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Sauvegarde…' : `Sauvegarder ${tables.length} table(s)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
