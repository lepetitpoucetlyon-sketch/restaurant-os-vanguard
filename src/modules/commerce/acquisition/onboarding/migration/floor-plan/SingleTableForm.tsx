'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { nextKey, type TableShape, type WizardTable } from './BatchTableForm';

interface SingleTableFormProps {
  zone: string;
  onAdd: (table: WizardTable) => void;
}

export function SingleTableForm({ zone, onAdd }: SingleTableFormProps) {
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
