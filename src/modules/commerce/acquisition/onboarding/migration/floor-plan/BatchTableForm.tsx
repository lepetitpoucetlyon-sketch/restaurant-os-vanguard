"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useLanguage } from "@/shared/hooks";
export type TableShape = 'rect' | 'circle';

export interface WizardTable {
  _key: string;
  zone: string;
  number: string;
  seats: number;
  shape: TableShape;
}

let _keyCounter = 0;
export function nextKey() {
  return `wt-${++_keyCounter}`;
}

export const SHAPE_LABELS: Record<TableShape, string> = {
  rect: 'Rectangulaire',
  circle: 'Ronde',
};

interface BatchFormProps {
  zone: string;
  onAdd: (tables: WizardTable[]) => void;
}

export function BatchTableForm({ zone, onAdd }: BatchFormProps) {
  const { t } = useLanguage();
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
      <p className="text-xs font-semibold text-text-primary">{t('commerce.floorPlan.batchGenerationFor')}<span className="text-accent">{zone}</span></p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-text-muted mb-1">De la table n°</label>
          <input
            type="number"
            min={1}
            value={from}
            onChange={e => setFrom(Math.max(1, Number(e.target.value)))}
            className="w-full rounded border border-border bg-bg-secondary px-2 py-1 text-text-primary"
          />
        </div>
        <div>
          <label className="block text-text-muted mb-1">{t('commerce.floorPlan.startingAtTableNo')}</label>
          <input
            type="number"
            min={1}
            value={to}
            onChange={e => setTo(Math.max(1, Number(e.target.value)))}
            className="w-full rounded border border-border bg-bg-secondary px-2 py-1 text-text-primary"
          />
        </div>
        <div>
          <label className="block text-text-muted mb-1">Couverts / table</label>
          <input
            type="number"
            min={1}
            value={seats}
            onChange={e => setSeats(Math.max(1, Number(e.target.value)))}
            className="w-full rounded border border-border bg-bg-secondary px-2 py-1 text-text-primary"
          />
        </div>
        <div>
          <label className="block text-text-muted mb-1">Forme</label>
          <select
            value={shape}
            onChange={e => setShape(e.target.value as TableShape)}
            className="w-full rounded border border-border bg-bg-secondary px-2 py-1 text-text-primary"
          >
            <option value="rect">Rectangulaire</option>
            <option value="circle">Ronde</option>
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={handleGenerate}
        className="w-full py-2 rounded-md bg-accent text-text-on-accent text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5 transition-all"
      >
        <Plus className="w-3.5 h-3.5" /> Générer {Math.max(0, to - from + 1)} table(s)
      </button>
    </div>
  );
}
