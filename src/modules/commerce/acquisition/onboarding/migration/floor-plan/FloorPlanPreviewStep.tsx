'use client';

import { Trash2, ChevronLeft, Save, Loader2 } from 'lucide-react';
import { SHAPE_LABELS, type WizardTable } from './BatchTableForm';

interface FloorPlanPreviewStepProps {
  tables: WizardTable[];
  updateTable: (key: string, field: keyof WizardTable, value: string | number) => void;
  removeTable: (key: string) => void;
  onBack: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function FloorPlanPreviewStep({
  tables,
  updateTable,
  removeTable,
  onBack,
  onSave,
  saving,
}: FloorPlanPreviewStepProps) {
  return (
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
                <td className="px-4 py-2 font-mono text-micro text-text-muted">
                  table-{t.zone.toLowerCase().replace(/\s+/g, '-')}-{t.number}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => removeTable(t._key)}
                    className="text-status-danger hover:text-red-600 transition-colors"
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
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Retour
        </button>
        <button
          onClick={onSave}
          disabled={saving || tables.length === 0}
          className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-text-primary disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Sauvegarde…' : `Sauvegarder ${tables.length} table(s)`}
        </button>
      </div>
    </div>
  );
}
